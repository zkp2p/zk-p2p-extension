import React, { MouseEventHandler, ReactElement, ReactNode, useState } from 'react';
import { useNavigate } from 'react-router';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import browser from 'webextension-polyfill';
import { User, PlusCircle, DollarSign } from 'react-feather';
import styled from 'styled-components';

import classNames from 'classnames';

import { notarizeRequest, setActiveTab, useActiveTabUrl, useRequests } from '../../reducers/requests';
import bookmarks from '../../../utils/bookmark/bookmarks.json';
import { replayRequest, urlify } from '../../utils/misc';
import { get, NOTARY_API_LS_KEY, PROXY_API_LS_KEY } from '../../utils/storage';
import Icon from '../../components/Icon';
import { colors } from '../../theme/colors';


export default function Home(): ReactElement {
  const requests = useRequests();
  const url = useActiveTabUrl();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  /*
   * State
   */

  const [originalTabId, setOriginalTabId] = useState<number | null>(null);

  /*
   * Handlers
   */

  const handleCreateTab = async(bm: any) => {
    const [tab] = await browser.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });
    // Store the original tab ID
    if (tab) {
      console.log('originalTabId123', tab.id);
      setOriginalTabId(tab.id || null);
    }
    chrome.tabs.create({
      url: bm.targetUrl
    }).then(newTab => {
      dispatch(setActiveTab(newTab))
    })
  }

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

  return (
    <PageWrapper>
      <IntroductionContainer>
        <IntroductionTitle>Welcome to ZKP2P</IntroductionTitle>
        <IntroductionDescription>
          [Placeholder] This extension is meant to be used with the client: zkp2p.xyz
        </IntroductionDescription>
      </IntroductionContainer>
      {/* <div className="flex flex-col flex-nowrap justify-center gap-2 mx-4">
        <NavButton fa="fa-solid fa-table" onClick={() => navigate('/requests')}>
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
        </NavButton>
      </div> */}

      {/* {!bookmarks.length && (
        <div className="flex flex-col flex-nowrap">
          <div className="flex flex-col items-center justify-center text-slate-300 cursor-default select-none">
            <div>No available notarization for {url?.hostname}</div>
            <div>
              Browse <Link to="/requests">Requests</Link>
            </div>
          </div>
        </div>
      )} */}

      <BookmarkContainer>
        {bookmarks.map((bm, i) => {
          try {
            const regex = new RegExp(bm.url); // Assuming bm.url contains a regex pattern
            const reqs = requests.filter((req) => {
              return regex.test(req?.url);
            });

            const bmHost = urlify(bm.targetUrl)?.host;
            const isReady = !!reqs.length;

            return (
              <BookmarkCard
                key={i}
                onClick={() => {
                  navigate(`/registration`);
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

                  <button
                    className="button w-fit self-end mt-2"
                    onClick={() => handleCreateTab(bm)}
                  >
                    {`Go to ${bmHost}`}
                  </RequestActionButton>
                )} */}
              </BookmarkCard>
            );
          } catch (e) {
            return null;
          }
        })}
      </BookmarkContainer>

      {/* <Button
        fullWidth
        onClick={() => {
          navigate('/custom');
        }}
      /> */}
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

// const RequestActionButton = styled.button`
//   width: fit-content;
//   align-self: flex-end;
//   margin-top: 0.5rem;
// `;

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
