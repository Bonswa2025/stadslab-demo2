export const metadata = { title: 'Stadslab – Stable v9', description: 'Backoffice + Manuals demo' };
import './(styles)/globals.css';
import SeedData from '@/components/internal/SeedData';
export default function RootLayout({ children }: { children: React.ReactNode }){
  return (
    <html lang="nl">
      <body>
        <header>
          <nav>
            <strong>Stadslab Stable v9</strong>
            <a className="pill" href="/backoffice">Backoffice</a>
            <a className="pill" href="/manuals">Handleidingen</a>
          </nav>
        </header>
        <main><SeedData />{children}</main>
      </body>
    </html>
  );
}
