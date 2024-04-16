import React, { useEffect } from 'react';
import browser from 'webextension-polyfill';
import { prove, verify } from 'tlsn-js';

import { BackgroundActiontype } from '../Background/rpc';
import { urlify } from '../../utils/misc';

const Offscreen = () => {
  useEffect(() => {
    // @ts-ignore
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.type) {
        case BackgroundActiontype.process_prove_request: {
          const {
            url,
            method,
            headers,
            body = '',
            maxSentData,
            maxRecvData,
            notaryUrl,
            websocketProxyUrl,
            id,
            secretHeaders,
            secretResps,
            metadata,
            originalTabId,
          } = request.data;

          (async () => {
            try {
              const token = urlify(url)?.hostname || '';
              const proof = await prove(url, {
                method,
                headers,
                body,
                maxSentData,
                maxRecvData,
                notaryUrl,
                websocketProxyUrl: websocketProxyUrl + `?token=${token}`,
                secretHeaders,
                secretResps,
              });

              browser.runtime.sendMessage({
                type: BackgroundActiontype.finish_prove_request,
                data: {
                  id,
                  proof,
                  metadata,
                  originalTabId,
                },
              });
            } catch (error) {
              console.log('i caught an error');
              console.error(error);
              browser.runtime.sendMessage({
                type: BackgroundActiontype.finish_prove_request,
                data: {
                  id,
                  error,
                  metadata
                },
              });
            }
          })();

          break;
        }
        case BackgroundActiontype.verify_proof: {
          (async () => {
            const result = await verify(request.data);
            sendResponse(result);
          })();

          return true;
        }
        case BackgroundActiontype.verify_prove_request: {
          (async () => {
            const result = await verify(request.data.proof);

            if (result) {
              chrome.runtime.sendMessage<any, string>({
                type: BackgroundActiontype.finish_prove_request,
                data: {
                  id: request.data.id,
                  verification: {
                    sent: result.sent,
                    recv: result.recv,
                  },
                },
              });
            }
          })();
          break;
        }
        default:
          break;
      }
    });
  }, []);

  return <div className="App" />;
};

export default Offscreen;
