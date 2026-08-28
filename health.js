export async function handler(event, context) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      status: 'ok',
      store: 'Jankalyan Medical Sangola',
      platform: 'Netlify Serverless Function',
      timings: '24x7',
      contact: '+91 86691 18742',
      timestamp: new Date().toISOString()
    })
  };
}
