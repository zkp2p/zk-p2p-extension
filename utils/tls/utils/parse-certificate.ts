import { crypto } from '../crypto'
import type { CertificatePublicKey, CipherSuite, Key, TLSProcessContext, X509Certificate } from '../types'
import { SUPPORTED_NAMED_CURVE_MAP, SUPPORTED_SIGNATURE_ALGS, SUPPORTED_SIGNATURE_ALGS_MAP } from './constants'
import { getHash } from './decryption-utils'
import { areUint8ArraysEqual, concatenateUint8Arrays, strToUint8Array } from './generics'
import { expectReadWithLength, packWithLength } from './packets'
import { ROOT_CAS } from './root-ca'
import { loadX509FromDer } from './x509'

type VerifySignatureOptions = {
	signature: Uint8Array
	algorithm: keyof typeof SUPPORTED_SIGNATURE_ALGS_MAP
	publicKey: CertificatePublicKey
	signatureData: Uint8Array
}

const CERT_VERIFY_TXT = strToUint8Array('TLS 1.3, server CertificateVerify')

export function parseCertificates(
	data: Uint8Array,
	{ version }: TLSProcessContext
) {
	// context, kina irrelevant
	const ctx = version === 'TLS1_3' ? read(1)[0] : 0
	// the data itself
	data = readWLength(3)

	const certificates: X509Certificate[] = []
	while(data.length) {
		// the certificate data
		const cert = readWLength(3)
		const certObj = loadX509FromDer(cert)

		certificates.push(certObj)
		if(version === 'TLS1_3') {
			// extensions
			readWLength(2)
		}
	}

	return { certificates, ctx }

	function read(bytes: number) {
		const result = data.slice(0, bytes)
		data = data.slice(bytes)
		return result
	}

	function readWLength(bytesLength = 2) {
		const content = expectReadWithLength(data, bytesLength)
		data = data.slice(content.length + bytesLength)

		return content
	}
}

export function parseServerCertificateVerify(data: Uint8Array) {
	// data = readWLength(2)
	const algorithmBytes = read(2)
	const algorithm = SUPPORTED_SIGNATURE_ALGS.find(
		alg => (
			areUint8ArraysEqual(
				SUPPORTED_SIGNATURE_ALGS_MAP[alg]
					.identifier,
				algorithmBytes
			)
		)
	)

	if(!algorithm) {
		throw new Error(`Unsupported signature algorithm '${algorithmBytes}'`)
	}

	const signature = readWLength(2)

	return { algorithm, signature }

	function read(bytes: number) {
		const result = data.slice(0, bytes)
		data = data.slice(bytes)
		return result
	}

	function readWLength(bytesLength = 2) {
		const content = expectReadWithLength(data, bytesLength)
		data = data.slice(content.length + bytesLength)

		return content
	}
}

export async function verifyCertificateSignature({
	signature,
	algorithm,
	publicKey,
	signatureData,
}: VerifySignatureOptions) {
	const { algorithm: cryptoAlg } = SUPPORTED_SIGNATURE_ALGS_MAP[algorithm]
	const pubKey = await crypto.importKey(
		cryptoAlg,
		publicKey,
		'public'
	)
	const verified = await crypto.verify(cryptoAlg, {
		data: signatureData,
		signature,
		publicKey: pubKey
	})

	if(!verified) {
		throw new Error(`${algorithm} signature verification failed`)
	}
}

export async function getSignatureDataTls13(
	hellos: Uint8Array[] | Uint8Array,
	cipherSuite: CipherSuite
) {
	const handshakeHash = await getHash(hellos, cipherSuite)
	return concatenateUint8Arrays([
		new Uint8Array(64).fill(0x20),
		CERT_VERIFY_TXT,
		new Uint8Array([0]),
		handshakeHash
	])
}

type Tls12SignatureDataOpts = {
	clientRandom: Uint8Array
	serverRandom: Uint8Array
	curveType: keyof typeof SUPPORTED_NAMED_CURVE_MAP
	publicKey: Key
}

export async function getSignatureDataTls12(
	{
		clientRandom,
		serverRandom,
		curveType,
		publicKey,
	}: Tls12SignatureDataOpts,
) {
	const publicKeyBytes = await crypto.exportKey(publicKey)
	return concatenateUint8Arrays([
		clientRandom,
		serverRandom,
		concatenateUint8Arrays([
			new Uint8Array([3]),
			SUPPORTED_NAMED_CURVE_MAP[curveType].identifier,
		]),
		packWithLength(publicKeyBytes)
			// pub key is packed with 1 byte length
			.slice(1)
	])
}

export async function verifyCertificateChain(
	chain: X509Certificate[],
	host: string,
	additionalRootCAs?: X509Certificate[]
) {
	const rootCAs = [
		...ROOT_CAS,
		...additionalRootCAs || []
	]

	const commonNames = [
		...chain[0].getSubjectField('CN'),
		...chain[0].getAlternativeDNSNames()
	]
	if(!commonNames.some(cn => matchHostname(host, cn))) {
		throw new Error(`Certificate is not for host ${host}`)
	}


	let tmpChain = [...chain]
	let rootCert = tmpChain.shift()!
	// look for issuers until we hit the end
	while (tmpChain.length) {
		const cn = rootCert.getSubjectField('CN')
		const issuer = findIssuer(tmpChain, rootCert)

		//in case there are orphan certificates in chain, but we found the root
		if (!issuer){
			break
		}

		if(!rootCert.isWithinValidity()) {
			throw new Error(`Certificate ${cn} is not within validity period`)
		}

		if(!issuer.cert.isIssuer(rootCert)) {
			throw new Error(`Certificate ${cn} was not issued by certificate ${issuer.cert.getSubjectField('CN')}`)
		}

		if(!(await issuer.cert.verifyIssued(rootCert))) {
			throw new Error(`Certificate ${cn} issue verification failed`)
		}

		//remove issuer cert from chain
		tmpChain.splice(issuer.index, 1);

		rootCert = issuer.cert
	}

	const rootIssuer = rootCAs.find(r => r.isIssuer(rootCert))
	if(!rootIssuer) {
		throw new Error('Root CA not found. Could not verify certificate')
	}

	const verified = await rootIssuer.verifyIssued(rootCert)
	if(!verified) {
		throw new Error('Root CA did not issue certificate')
	}

	function findIssuer(chain:X509Certificate[], cert: X509Certificate) {
		for(let i = 0; i < chain.length ; i++) {
			if(chain[i].isIssuer(cert)) {
				return {cert: chain[i], index: i}
			}
		}

		return null
	}
}

/**
 * Checks if a hostname matches a common name
 * @param host the hostname, eg. "google.com"
 * @param commonName the common name from the certificate,
 * 	eg. "*.google.com", "google.com"
 */
function matchHostname(host: string, commonName: string) {
	// write a regex to match the common name
	// and check if it matches the hostname
	const hostComps = host.split('.')
	const cnComps = commonName.split('.')

	if(cnComps.length !== hostComps.length) {
		// can ignore the first component if it's a wildcard
		if(
			cnComps[0] === '*'
			&& cnComps.length === hostComps.length + 1
		) {
			cnComps.shift()
		} else {
			return false
		}
	}

	return hostComps.every((comp, i) => (
		comp === cnComps[i]
			|| cnComps[i] === '*'
	))
}