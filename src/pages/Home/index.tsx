import React, { ReactElement } from 'react';
import { useNavigate } from 'react-router';
import browser from 'webextension-polyfill';
import { User, PlusCircle, DollarSign } from 'react-feather';
import styled from 'styled-components';

import { notarizeRequest, useActiveTabUrl, useRequests } from '../../reducers/requests';
import bookmarks from '../../../utils/bookmark/bookmarks.json';
import { get, NOTARY_API_LS_KEY, PROXY_API_LS_KEY } from '@utils/storage';
import { replayRequest, urlify } from '@utils/misc';
import { colors } from '@theme/colors';


export default function Home(): ReactElement {
  const navigate = useNavigate();

  const requests = useRequests();
  const url = useActiveTabUrl();

  /*
   * Handlers
   */

  const handleBookmarkPressedForIndex = (index: number) => {
    switch (index) {
      case 0:
        return navigate(`/registration`);

      case 1:
        return navigate(`/deposit`);

      case 2:
      default:
        return navigate(`/onramp`);
    }
  };

  /*
   * Helpers
   */

  const iconForIndex = (index: number) => {
    switch (index) {
      case 0:
        return <StyledUser />;

      case 1:
        return <StyledPlusCircle />;

      case 2:
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
        <IntroductionTitle>Welcome to ZKP2P</IntroductionTitle>
        <IntroductionDescription>
          [Placeholder] This extension is meant to be used with the client: zkp2p.xyz
        </IntroductionDescription>
      </IntroductionContainer>

        {/* <NavButton fa="fa-solid fa-table" onClick={() => navigate('/requests')}>
          <span>Requests</span>
          <span>{`(${requests.length})`}</span>
        </NavButton>
        <NavButton fa="fa-solid fa-magnifying-glass" onClick={() => navigate('/custom')}>
          Custom
        </NavButton>
        <NavButton fa="fa-solid fa-magnifying-glass" onClick={() => navigate('/verify')}>
          Verify
        </NavButton>
        <NavButton fa="fa-solid fa-list" onClick={() => navigate('/history')}>
          History
        </NavButton>
        <NavButton fa="fa-solid fa-gear" onClick={() => navigate('/options')}>
          Options
        </NavButton> */}

      <BookmarkContainer>
        {bookmarks.map((bm, i) => {
          return (
            <BookmarkCard
              key={i}
              onClick={() => {
                handleBookmarkPressedForIndex(i)
              }}
            >
              <IconContainer>
                {iconForIndex(i)}
                <BookmarkTitle>{bm.title}</BookmarkTitle>
                <BookmarkDescription>{bm.description}</BookmarkDescription>
              </IconContainer>

              {/* {isReady && (
                <button
                  className="button button--primary w-fit self-end mt-2"
                  onClick={async () => {
                    if (!isReady) return;

                    const req = reqs[0];
                    const res = await replayRequest(req);
                    const secretHeaders = req.requestHeaders
                      .map((h) => {
                        return `${h.name.toLowerCase()}: ${h.value || ''}` || '';
                      })
                      .filter((d) => !!d);

                    const secretResps = [] as string[];

                    bm.secretResponseSelector.forEach((secretResponseSelector) => {
                      const regex = new RegExp(secretResponseSelector, 'g');

                      console.log(res.text);
                      const matches = res.text.match(regex);
                      console.log('secretResponseSelector', secretResponseSelector);

                      if (matches) {
                        const hidden = matches[0];

                        const selectionStart = res.text.indexOf(hidden);
                        const selectionEnd = selectionStart + hidden.length;

                        if (selectionStart !== -1) {
                          secretResps.push(res.text.substring(selectionStart, selectionEnd));
                        }
                        console.log('secretResps', secretResps);
                      }
                    });

                    // Filter out any empty strings
                    const filteredSecretResps = secretResps.filter((d) => !!d);

                    const hostname = urlify(req.url)?.hostname;
                    const notaryUrl = await get(NOTARY_API_LS_KEY);
                    const websocketProxyUrl = await get(PROXY_API_LS_KEY);

                    const headers: { [k: string]: string } = req.requestHeaders.reduce(
                      (acc: any, h) => {
                        acc[h.name] = h.value;
                        return acc;
                      },
                      { Host: hostname },
                    );

                    headers['Accept-Encoding'] = 'identity';
                    headers['Connection'] = 'close';

                    console.log('res', res);
                    // Extract metadata to display in Web application
                    const metadataResp = [] as string[];
                    
                    // Add date of request if exists
                    const requestDate = res.response.headers.get('date') || res.response.headers.get('Date');
                    if (requestDate) {
                      metadataResp.push(requestDate);
                    }

                    bm.metaDataSelector.forEach((metaDataSelector) => {
                      const regex = new RegExp(metaDataSelector, 'g');

                      console.log(res.text);
                      const matches = res.text.match(regex);
                      console.log('metaDataSelector', metaDataSelector);

                      if (matches) {
                        const revealed = matches[0];

                        const selectionStart = res.text.indexOf(revealed);
                        const selectionEnd = selectionStart + revealed.length;

                        if (selectionStart !== -1) {
                          metadataResp.push(res.text.substring(selectionStart, selectionEnd));
                        }
                        console.log('metadataResp', metadataResp);
                      }
                    });

                    dispatch(
                      // @ts-ignore
                      notarizeRequest({
                        url: req.url,
                        method: req.method,
                        headers: headers,
                        body: req.requestBody,
                        maxTranscriptSize: 16384,
                        notaryUrl,
                        websocketProxyUrl,
                        secretHeaders,
                        secretResps: filteredSecretResps,
                        metadata: metadataResp,
                        originalTabId: originalTabId
                      }),
                    );

                    navigate(`/history`);
                  }}
                >
                  Notarize
                </button>
              )} */}
            </BookmarkCard>
          );
        })}
      </BookmarkContainer>
    </PageWrapper>
  );
}

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
`;

const IntroductionContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0rem 2rem 1rem 2rem;
  gap: 0.5rem;
  text-align: center;
  color: ${colors.white};
`;

const IntroductionTitle = styled.div`
  font-size: 18px;
  font-weight: 600;
`;

const IntroductionDescription = styled.div`
  font-size: 14px;
`;

const BookmarkContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0rem 2rem;
  gap: 1.5rem;
`;

const BookmarkCard = styled.div`
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  border: 1px solid ${colors.defaultBorderColor};
  border-radius: 12px;
  padding: 1.5rem;
  gap: 1rem;
  background-color: ${colors.selectorColor};
  color: ${colors.white};
  font-size: 14px;
  &:hover {
    background-color: ${colors.selectorHover};
    cursor: pointer;
  }
`;

const IconContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.25rem;
`;

const StyledUser = styled(User)`
  color: #fff;
  width: 28px;
  height: 28px;
`;

const StyledPlusCircle = styled(PlusCircle)`
  color: #fff;
  width: 28px;
  height: 28px;
`;

const StyledDollarSign = styled(DollarSign)`
  color: #fff;
  width: 28px;
  height: 28px;
`;

const BookmarkTitle = styled.div`
  padding-top: 0.5rem;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
`;

const BookmarkDescription = styled.div`
  font-size: 14px;
  text-align: center;
`;

// function NavButton(props: {
//   fa: string;
//   children?: ReactNode;
//   onClick?: MouseEventHandler;
//   className?: string;
//   disabled?: boolean;
// }): ReactElement {
//   return (
//     <button
//       className={classNames(
//         'flex flex-row flex-nowrap items-center justify-center',
//         'text-white rounded px-2 py-1 gap-1',
//         {
//           'bg-primary/[.8] hover:bg-primary/[.7] active:bg-primary': !props.disabled,
//           'bg-primary/[.5]': props.disabled,
//         },
//         props.className,
//       )}
//       onClick={props.onClick}
//       disabled={props.disabled}
//     >
//       <Icon className="flex-grow-0 flex-shrink-0" fa={props.fa} size={1} />
//       <span className="flex-shrink w-0 flex-grow font-bold">{props.children}</span>
//     </button>
//   );
// }
