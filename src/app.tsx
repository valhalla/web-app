import Map from './map';
import MainControl from './controls';
import SettingsPanel from './controls/settings-panel';
import { ToastContainer } from 'react-toastify';

export const App = () => {
  return (
    <div>
      <Map />
      <MainControl />
      <SettingsPanel />
      <ToastContainer
        position="bottom-center"
        autoClose={5000}
        limit={1}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
};
