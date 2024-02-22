import React from 'react';
import { createRoot } from 'react-dom/client';

// import Options from '../../pages/Options';
import './index.css';

const container = document.getElementById('app-container');
const root = createRoot(container!); // createRoot(container!) if you use TypeScript
root.render(<span />); // TODO: We don't need Options
