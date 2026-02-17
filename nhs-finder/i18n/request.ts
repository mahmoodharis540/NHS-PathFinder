import {getRequestConfig} from 'next-intl/server';
 
export default getRequestConfig(async () => {
  // Static for now, we'll change this later
  const locale = 'es';
 
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});

//copied from https://next-intl.dev/docs/getting-started/app-router