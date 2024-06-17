import React, { ReactElement } from 'react';
import { useNavigate } from 'react-router';
import { UserPlus, DollarSign } from 'react-feather';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStore } from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components';

import { Button } from '@components/common/Button';
import { useActiveTabUrl, useRequests } from '@reducers/requests';
import revolutBookmarks from '../../../utils/bookmark/revolut.json';

import { colors } from '@theme/colors';
import { ThemedText } from '@theme/text';
import { makeTLSClient, uint8ArrayToStr } from '../../../utils/tls/';
import { generateProof, encryptData } from '../../../utils/zkp';

function hexToBuffer(hexString: string): Buffer {
    // Ensure the hex string has an even length (required for valid byte conversion)
    if (hexString.length % 2 !== 0) {
        throw new Error("Invalid hex string: length must be even");
    }

    // Create a Buffer from the hex string
    const buffer = Buffer.from(hexString, 'hex');

    return buffer;
}

function uint8ArrayToHex(array: Uint8Array): string {
    // Convert each byte in the array to a hexadecimal string and concatenate them
    return Array.from(array).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export default function Home(): ReactElement {
  const navigate = useNavigate();

  const requests = useRequests();
  const url = useActiveTabUrl();

  /*
   * Handlers
   */

  const handleReturnToTab = async () => {
    chrome.tabs.create({ url: 'https://zkp2p.xyz' });
  };

  const handleBookmarkPressedForIndex = (index: number) => {
    switch (index) {
      case 0:
        return navigate(`/registration`);

      case 1:
      default:
        return navigate(`/onramp`);
    }
  };

  const handleTLSPPressed = async () => {
    const host = '127.0.0.1'; // TODO: hardcoded to local server
    // const port = 8000;
    const ws = new WebSocket(`ws://127.0.0.1:55688`);

    ws.binaryType = 'arraybuffer'; // Ensure binary data is treated as ArrayBuffers

    const write = async ({ header, content }: { header: Buffer; content: Buffer }) => {
      const headerArray = new Uint8Array(header);
      const contentArray = new Uint8Array(content);
  
      // Concatenate header and content into a single Uint8Array
      const dataToSend = new Uint8Array(headerArray.length + contentArray.length);
      dataToSend.set(headerArray);
      dataToSend.set(contentArray, headerArray.length);
  
      // Sending the concatenated data via WebSocket
      if (ws.readyState === WebSocket.OPEN) {
          ws.send(dataToSend.buffer); // Ensure to send ArrayBuffer
      } else {
          console.error('WebSocket is not open');
      }
    };

    const tls = makeTLSClient({
        host,
        verifyServerCertificate: false,
        cipherSuites: [
          'TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256'
        ],
        namedCurves: ['SECP256R1', 'SECP384R1'], // Browser does not support x25519
        write, // Pass the updated write function that uses WebSocket
        onHandshake() {
          console.log('handshake completed successfully')
          const getReq = `GET / HTTP/1.1\r\nHost: ${host}\r\n\r\n` // TODO: hardcoded get request
          tls.write(Buffer.from(getReq))
        },
        onApplicationData(plaintext) {
            const str = new TextDecoder().decode(plaintext);
            console.log('received application data: ', str);
        },
        onTlsEnd(error) {
            console.error('TLS connection ended: ', error);
        }
    });

    ws.onopen = () => {
        console.log('WebSocket connection established');
        tls.startHandshake(); // Start the TLS handshake once the WebSocket is open
    };

    ws.onmessage = (event) => {
        const data = new Uint8Array(event.data);
        tls.handleReceivedBytes(data);
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
        console.log('WebSocket closed');
    };
  };

  const handleTLSPProofGen = async () => {
    // TODO: get key and iv from TLS client
		const key = hexToBuffer('7f01bd270dd298efc3df260c63296def172a3b49780df066aed81e3a3b137890')
		const iv = hexToBuffer('d546e650406bd9a5df6f523d')
		const ciphertextWithMac = hexToBuffer('1619961131ae66450ced7ef9a906649e6b61729f61a04bc57d817352f7fc0c9a4e8e2385')
		const ciphertext = ciphertextWithMac.subarray(0, ciphertextWithMac.length - 16);

		// Redact first 4 bytes with `X` = 58
		// const redactedPlaintext = '585858586f2c2073656375726520776f726c6421'
		// const redactedCiphertext = encryptData('chacha20', hexToBuffer(redactedPlaintext), key, iv)

		const proof = await generateProof({
			algorithm: 'chacha20',
			privateInput: {
				key,
				iv,
				offset: 0 // This will always be zero. We will update our nonce / IV with the counter for new encryption blocks
			},
			publicInput: { ciphertext: ciphertext },
		})

		console.log('Proof:', proof.proofJson)
		console.log('Redacted Plaintext:', uint8ArrayToHex(proof.plaintext.slice(0, ciphertext.length)))
		console.log('Original Ciphertext', uint8ArrayToHex(ciphertext))
		// console.log('Redacted Ciphertext', uint8ArrayToHex(redactedCiphertext))
  };

  /*
   * Helpers
   */

  const iconForIndex = (index: number) => {
    switch (index) {
      case 0:
        return <StyledUser />;

      case 1:
      default:
        return <StyledDollarSign />;
    }
  };

  /*
   * Component
   */

  return (
    <PageWrapper>
      <IntroductionContainer>
        <IntroductionTextContainer>
          <IntroductionTitle>
            Welcome to ZKP2P Peer
          </IntroductionTitle>
          
          <IntroductionDescription>
            This browser assistant is meant to be used with zkp2p.xyz
          </IntroductionDescription>
        </IntroductionTextContainer>

        <ButtonContainer>
          <Button
            onClick={() => handleReturnToTab()}
            width={164}
            height={40}
            fontSize={14}
          >
            Go to ZKP2P
          </Button>
        </ButtonContainer>
      </IntroductionContainer>

      <IntegrationsContainer>
        <TitleContainer>
          <IntroductionTitle>
            Integrations
          </IntroductionTitle>
        </TitleContainer>

        <RevolutContainer>
          <ThemedText.TableHeaderSmall textAlign="left" paddingLeft={"0.5rem"}>
              Revolut
          </ThemedText.TableHeaderSmall>

          <ActionsGrid>
            {revolutBookmarks.map((bookmark, index) => {
              return (
                <ActionCard
                  key={index}
                  onClick={() => {
                    handleBookmarkPressedForIndex(index)
                  }}
                >
                  {iconForIndex(index)}

                  <ActionTitle>
                    {bookmark.title}
                  </ActionTitle>

                  <ActionSubtitle>
                    {bookmark.description}
                  </ActionSubtitle>
                </ActionCard>
              );
            })}
          </ActionsGrid>
        </RevolutContainer>
        <RevolutContainer>
          <ThemedText.TableHeaderSmall textAlign="left" paddingLeft={"0.5rem"}>
              Revolut TLSP
          </ThemedText.TableHeaderSmall>

          <ActionsGrid>
            <ActionCard
                onClick={handleTLSPPressed}
            >
              {iconForIndex(0)}

              <ActionTitle>
                TLSP Client
              </ActionTitle>

              <ActionSubtitle>
                Extract key and nonce
              </ActionSubtitle>
            </ActionCard>
            <ActionCard
                onClick={handleTLSPProofGen}
              >
                {iconForIndex(0)}

                <ActionTitle>
                  TLSP Proof
                </ActionTitle>

                <ActionSubtitle>
                  Generate Chacha20 ZKP
                </ActionSubtitle>
              </ActionCard>
            </ActionsGrid>
        </RevolutContainer>
      </IntegrationsContainer>

      {/* <ComingSoonContainer>
        <TitleContainer>
          <ThemedText.ModalHeadline textAlign="left">
            Coming Soon
          </ThemedText.ModalHeadline>
        </TitleContainer>

        <ComingSoonBodyContainer
          onClick={() => {
            chrome.tabs.create({ url: 'https://t.me/+XDj9FNnW-xs5ODNl' });
          }}
          >
          <FontAwesomeIcon
            icon={faStore}
            style={{ color: colors.white, width: '28px', height: '28px'}}
          />

          <ThemedText.SubHeaderSmall textAlign="center" lineHeight={1.3}>
            Have ideas for other assets you would like to see on ZKP2P?<br/>Let us know!
          </ThemedText.SubHeaderSmall>
        </ComingSoonBodyContainer>
      </ComingSoonContainer> */}
    </PageWrapper>
  );
}

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: calc(100vh - 76px);
  height: calc(100vh - 76px);
  overflow: auto;
  padding: 0 1.5rem 1rem;
  box-sizing: border-box;
`;

const IntroductionContainer = styled.div`
  display: flex;
  max-height: 160px;
  flex-direction: column;
  padding: 0rem 0.5rem 1rem 0.5rem;
  gap: 0.75rem;
  text-align: center;
  color: ${colors.white};
`;

const IntroductionTextContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 0.25rem;
`;

const IntroductionTitle = styled.div`
  text-align: left;
  font-size: 18px;
  font-weight: 600;
`;

const IntroductionDescription = styled.div`
  text-align: left;
  font-size: 15px;
`;

const IntegrationsContainer = styled.div`
  display: flex;
  max-height: 196px;
  flex-direction: column;
  padding: 1rem 0;
  gap: 0.75rem;
`;

const TitleContainer = styled.div`
  padding-left: 0.5rem;
  color: ${colors.white};
`;

const RevolutContainer = styled.div`
  display: flex;
  flex-direction: column;
  color: ${colors.white};
  gap: 0.75rem;
`;

const ActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
`;

const ActionCard = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;

  flex-wrap: nowrap;
  border-radius: 12px;
  padding: 1rem 1.25rem;
  background-color: ${colors.selectorColor};

  &:hover {
    background-color: ${colors.selectorHover};
    cursor: pointer;
  }
`;

const StyledUser = styled(UserPlus)`
  color: ${colors.white};
  width: 20px;
  height: 20px;
`;

const StyledDollarSign = styled(DollarSign)`
  color: ${colors.white};
  width: 20px;
  height: 20px;
`;

const ActionTitle = styled.div`
  padding-top: 1rem;
  font-size: 14px;
  font-weight: 600;
  color: ${colors.titleColor};
`;

const ActionSubtitle = styled.div`
  font-size: 13px;
  color: ${colors.subtitleColor};
`;

const ComingSoonContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1rem 0;
  gap: 0.75rem;
  flex-grow: 1;
  overflow: hidden;
  min-height: 200px;
`;

const ComingSoonBodyContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 1.25rem 2rem;
  gap: 0.75rem;
  border-radius: 16px;
  background-color: ${colors.selectorColor};
  color: #ffffff;

  &:hover {
    background-color: ${colors.selectorHover};
    cursor: pointer;
  }

  flex-grow: 1;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;
