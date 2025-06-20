import React, { useEffect, useState } from 'react';
import { TinaCMS, useCMS } from 'tinacms';
import { useTina } from 'tinacms';

interface TinaStaticWrapperProps {
  query: string;
  variables: object;
  data: any;
}

export default function TinaStaticWrapper({ query, variables, data }: TinaStaticWrapperProps) {
  const cms = useCMS();
  const { data: tinaData } = useTina({
    query,
    variables,
    data
  });

  // Initialize TinaCMS only in client-side
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('tina-admin')) {
      const tinacms = new TinaCMS({
        enabled: true,
        sidebar: true,
        toolbar: true
      });

      return () => tinacms.disable();
    }
  }, []);

  return (
    <div className="tina-static-content">
      <h1>{tinaData?.post?.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: tinaData?.post?.body }} />
    </div>
  );
}
