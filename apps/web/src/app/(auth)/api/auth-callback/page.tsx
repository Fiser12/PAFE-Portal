import { headers } from 'next/headers'

export default async function AuthCallbackPage() {
  const headersList = await headers()
  const cookies = headersList.get('cookie') || ''

  // Extraer el sessionToken
  const sessionTokenMatch = cookies.match(/authjs\.session-token=([^;]+)/)
  const sessionToken = sessionTokenMatch ? sessionTokenMatch[1] : null
  console.error('sessionToken', sessionToken)
  return (
    <div style={{
      textAlign: 'center',
      padding: '50px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2>Auth Callback</h2>
      <p>Procesando autenticación...</p>

      <script
        dangerouslySetInnerHTML={{
          __html: `
              console.error('🍪 Cookies:', '${cookies}');
              console.error('🔐 Session Token:', '${sessionToken}');
              
              const data = {
                token: '${sessionToken}', // Enviar como 'token' para que coincida con auth.service.ts
                sessionToken: '${sessionToken}',
                cookies: '${cookies}'
              };
              
              console.error('📤 Enviando datos:', data);
              
              if (window.opener) {
                window.opener.postMessage(data, window.location.origin);
                console.error('✅ Datos enviados al parent');
              } else {
                console.error('⚠️ No window.opener found');
              }
              
              setTimeout(() => {
                console.error('🔒 Cerrando ventana...');
                window.close();
              }, 1000);
            `
        }}
      />
    </div>
  )
}
