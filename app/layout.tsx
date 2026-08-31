import type {Metadata,Viewport} from 'next'; import './globals.css'; import './daily.css'; import './accent.css';
export const metadata:Metadata={title:'Mi habitación',description:'Control privado y local del orden de tu habitación.'};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#f5f3ed'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>}
