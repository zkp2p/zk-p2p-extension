import React, { ReactElement } from 'react';
import { useParams } from 'react-router';

import RequestDetail from '../../components/RequestDetail';

export default function Request(): ReactElement {
  const params = useParams<{ requestId: string }>();

  return <>{!!params.requestId && <RequestDetail requestId={params.requestId} />}</>;
}
