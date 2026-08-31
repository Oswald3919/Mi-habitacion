import type {Metadata,Viewport} from 'next'; import './globals.css'; import './daily.css'; import './accent.css'; import PwaRegister from './pwa-register';
export const metadata:Metadata={title:'Mi habitación',description:'Control privado y local del orden de tu habitación.',manifest:'/manifest.webmanifest',icons:{icon:'/app-icon.svg',apple:'/app-icon.svg'},appleWebApp:{capable:true,title:'Mi habitación',statusBarStyle:'default'}};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#f5f3ed'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}<PwaRegister/></body></html>}
