const token = {
  name: 'Ruben Garcia',
  email: 'ruben@nexolabs.xyz',
  picture:
    'https://lh3.googleusercontent.com/a/ACg8ocKUjpJ_Bp7bwLfRkY8n6ib2E0XFvekSYiBm1c9k1-jW5c8J3bc=s96-c',
  sub: 'ee16483c-d972-4fbc-be12-b4d0f0e1ee34',
  iat: 1751323391,
  exp: 1753915391,
  jti: '742ccfa5-127c-4383-8ef5-35f7c6433450',
}

const API_BASE = 'http://localhost:3000'

async function testPayloadAPI() {
  console.log('🚀 Testing PayloadCMS API with JWT token')
  console.log('User ID:', token.sub)
  console.log('Expires:', new Date(token.exp * 1000).toLocaleString())
  console.log('---')

  // Lista de colecciones para testear
  const collections = [
    'catalog-item',
    'reservation',
    'users',
    'posts',
    'pages',
    'media',
    'taxonomy',
  ]

  for (const collection of collections) {
    await testCollection(collection)
  }

  // Testar información del usuario actual
  await testCurrentUser()

  // Testar GraphQL
  await testGraphQL()
}

async function testCollection(slug) {
  try {
    console.log(`\n📋 Testing collection: ${slug}`)

    const response = await fetch(`${API_BASE}/api/${slug}`, {
      headers: {
        Authorization: `Bearer ${JSON.stringify(token)}`,
        'Content-Type': 'application/json',
      },
    })

    console.log(`Status: ${response.status}`)

    if (response.ok) {
      const data = await response.json()
      console.log(`✅ Success - Total docs: ${data.totalDocs || 'N/A'}`)

      if (data.docs && data.docs.length > 0) {
        console.log(`First doc ID: ${data.docs[0].id}`)
        console.log(`Fields: ${Object.keys(data.docs[0]).join(', ')}`)
      }
    } else {
      const error = await response.text()
      console.log(`❌ Error: ${error}`)
    }
  } catch (err) {
    console.log(`❌ Network error: ${err.message}`)
  }
}

async function testCurrentUser() {
  try {
    console.log(`\n👤 Testing current user info`)

    const response = await fetch(`${API_BASE}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${JSON.stringify(token)}`,
        'Content-Type': 'application/json',
      },
    })

    console.log(`Status: ${response.status}`)

    if (response.ok) {
      const data = await response.json()
      console.log(`✅ Current user: ${data.email} (${data.name})`)
      console.log(`Role: ${data.role || 'No role set'}`)
    } else {
      const error = await response.text()
      console.log(`❌ Error: ${error}`)
    }
  } catch (err) {
    console.log(`❌ Network error: ${err.message}`)
  }
}

async function testGraphQL() {
  try {
    console.log(`\n🔍 Testing GraphQL API`)

    const query = `
      query {
        Users {
          docs {
            id
            name
            email
          }
        }
      }
    `

    const response = await fetch(`${API_BASE}/api/graphql`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${JSON.stringify(token)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })

    console.log(`Status: ${response.status}`)

    if (response.ok) {
      const data = await response.json()
      console.log(`✅ GraphQL Success`)
      console.log(`Users found: ${data.data?.Users?.docs?.length || 0}`)
    } else {
      const error = await response.text()
      console.log(`❌ GraphQL Error: ${error}`)
    }
  } catch (err) {
    console.log(`❌ Network error: ${err.message}`)
  }
}

// Ejecutar el test
testPayloadAPI()
  .then(() => {
    console.log('\n✨ Test completed!')
  })
  .catch(console.error)
