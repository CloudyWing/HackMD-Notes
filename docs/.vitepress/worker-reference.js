// Cloudflare Worker 參考實作 (方案 A)
// 如果未來想要更完善的解決方案，可以部署此 Worker 代碼

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
        return new Response(JSON.stringify({ error: 'Missing id parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    // 檢查是否需要累加計數
    const shouldIncrement = url.searchParams.get('increment') === 'true'

    let count
    if (shouldIncrement) {
        // 累加模式：讀取並累加
        count = await incrementCount(id)
    } else {
        // 只讀模式：只讀取不累加
        count = await getCount(id)
    }

    return new Response(JSON.stringify({ pageId: id, count }), {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    })
}

// 只讀取計數
async function getCount(id) {
    const value = await VIEWS.get(id)
    return value ? parseInt(value) : 0
}

// 累加計數
async function incrementCount(id) {
    const currentCount = await getCount(id)
    const newCount = currentCount + 1
    await VIEWS.put(id, newCount.toString())
    return newCount
}
