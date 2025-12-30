const { createServer } = require('http')
const { parse } = require('url')
const { join } = require('path')

const { readFile } = require('fs')

const next = require('next')

const dev = false
const port = process.env.PORT || 3000
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    const pathname = parsedUrl.pathname

    if (pathname.startsWith('/images/') || pathname.startsWith('/uploads/')) {
  const filePath = join(__dirname, 'public', pathname)

  return readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 404

      return res.end('File not found')
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");

    if (pathname.endsWith(".png")) res.setHeader("Content-Type", "image/png")
    if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) res.setHeader("Content-Type", "image/jpeg")
    if (pathname.endsWith(".svg")) res.setHeader("Content-Type", "image/svg+xml")
    if (pathname.endsWith(".pdf")) res.setHeader("Content-Type", "application/pdf")
    if (pathname.endsWith(".mp4")) res.setHeader("Content-Type", "video/mp4")
    if (pathname.endsWith(".mp3")) res.setHeader("Content-Type", "audio/mpeg")
    if (pathname.endsWith(".gif") || pathname.endsWith(".bmp") || pathname.endsWith(".tiff") || pathname.endsWith(".webp")) res.setHeader("Content-Type", "image/*")


    res.statusCode = 200

    return res.end(data)
  })
}


    handle(req, res, parsedUrl)
  }).listen(port, (err) => {
    if (err) throw err
    console.log(`> Server running on port ${port}`)
  })
})
