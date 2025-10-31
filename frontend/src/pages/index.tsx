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
      
      <DynamicLandingPageContent />
    </>
  );
}