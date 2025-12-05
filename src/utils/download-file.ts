export const downloadFile = ({
  data,
  fileName,
  fileType,
}: {
  data: string | ArrayBuffer;
  fileName: string;
  fileType: string;
}) => {
  // Create a blob with the data we want to download as a file
  const blob = new Blob([data], { type: fileType });
  // Create an anchor element and dispatch a click event on it
  // to trigger a download
  const aElem = document.createElement('a');
  aElem.download = fileName;
  aElem.href = window.URL.createObjectURL(blob);
  const clickEvt = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true,
  });
  aElem.dispatchEvent(clickEvt);
  aElem.remove();
};
