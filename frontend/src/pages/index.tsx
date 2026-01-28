import Head from "next/head";
import dynamic from 'next/dynamic';

const DynamicLandingPageContent = dynamic(
  () => import("@/components/LandingPageContent"),
  { ssr: false }
);

export function getStaticProps() {
    return {
        props: {},
    };
}

export default function LandingPage() {
  
  return (
    <>
      <Head>
        <title>JobLog</title>

        <meta property="og:title" content="JobLog" />
        <meta property="og:description" content="Full-stack platform for organising and visualising your job search." />
        <meta name="description" content="Full-stack platform for organising and visualising your job search pipeline." />
        <meta property="og:url" content="https://joblog.athulthampan.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://joblog.athulthampan.com/images/joblog.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="JobLog" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="JobLog" />
        <meta name="twitter:description" content="Full-stack platform for organising and visualising your job search pipeline." />
        <meta name="twitter:image" content="https://joblog.athulthampan.com/images/joblog.png" />
      </Head>
      
      <div style={{ maxWidth: '450px', background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 16px' }}>
          JobLog will be back soon!
        </h1>
        <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#4b5563', margin: '0 0 24px' }}>
          JobLog is currently undergoing scheduled maintenance to improve services.
        </p>
      </div>
      {/* <DynamicLandingPageContent /> */}
    </>
  );
}