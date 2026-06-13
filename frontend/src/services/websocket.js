const WS_BASE = 'ws://localhost:8005'

class WebSocketService {
  constructor() {
    this.connections = {}
    this.listeners = {}
  }

  connect(type, id, onMessage) {
    const key = `${type}_${id}`
    if (this.connections[key]) {
      this.connections[key].close()
    }

    const url = `${WS_BASE}/ws/${type}/${id}`
    const ws = new WebSocket(url)

    ws.onopen = () => {
      console.log(`✅ WS connected: ${url}`)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessage(data)
      } catch {
        onMessage({ raw: event.data })
      }
    }

    ws.onerror = (err) => {
      console.warn(`WS error on ${url}`, err)
    }

    ws.onclose = () => {
      console.log(`WS closed: ${url}`)
      delete this.connections[key]
    }

    this.connections[key] = ws
    return ws
  }

  disconnect(type, id) {
    const key = `${type}_${id}`
    if (this.connections[key]) {
      this.connections[key].close()
      delete this.connections[key]
    }
  }

  disconnectAll() {
    Object.values(this.connections).forEach((ws) => ws.close())
    this.connections = {}
  }
}

export const wsService = new WebSocketService()