export const parseUrlParams = () => {
  return Object.fromEntries(new URL(document.location.href).searchParams);
};
