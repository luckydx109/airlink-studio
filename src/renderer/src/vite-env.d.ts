/// <reference types="vite/client" />

import { AirLinkAPI } from '../../main/preload';

declare global {
  interface Window {
    airlinkAPI: AirLinkAPI;
  }
}

