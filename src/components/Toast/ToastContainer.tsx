import React from 'react';
import { ToastContainer as ToastifyContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './toast-custom.css';

export const ToastContainer: React.FC<{ isOverlayOpen?: boolean }> = ({ isOverlayOpen }) => {
  return (
    <ToastifyContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="colored"
      style={{
        zIndex: 9999999,
        filter: isOverlayOpen ? 'drop-shadow(0 0 8px #222)' : undefined,
      }}
    />
  );
};
