export default function Page(){
  return (
    <section>
      <h1 style={{fontSize:'1.5rem', marginBottom:'.5rem'}}>Welkom 👋</h1>
      <p>Kies hieronder wat je wilt openen.</p>
      <div style={{display:'flex', gap:'1rem', marginTop:'1rem'}}>
        <a className="pill" href="/backoffice">Backoffice</a>
        <a className="pill" href="/manuals">Handleidingen</a>
      </div>
      <p style={{marginTop:'1rem', fontSize:'.9rem', color:'#475569'}}>Tip: klik op Backoffice om een event te maken en op “Handleiding →” om direct naar de juiste truck te gaan.</p>
    </section>
  );
}
