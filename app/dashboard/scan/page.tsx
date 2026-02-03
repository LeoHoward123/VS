'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Wifi, WifiOff, RefreshCw, Camera } from 'lucide-react'
import { Scanner } from '@yudiel/react-qr-scanner'

export default function AttendanceScanner() {
  const supabase = createClient()
  const [input, setInput] = useState('')
  const [status, setStatus] = useState('Idle')
  const [isOnline, setIsOnline] = useState(true)
  const [pendingSync, setPendingSync] = useState(0)
  const [showQrScanner, setShowQrScanner] = useState(false)

  // 1. Check Online Status & Load Pending Scans
  useEffect(() => {
    setIsOnline(navigator.onLine)
    
    // Listen for network changes
    const handleOnline = () => { setIsOnline(true); syncOfflineData(); }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check if we have unsynced data on load
    const saved = localStorage.getItem('offline_attendance')
    if (saved) setPendingSync(JSON.parse(saved).length)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // 2. The Sync Function
  const syncOfflineData = async () => {
    const saved = localStorage.getItem('offline_attendance')
    if (!saved) return

    const offlineQueue = JSON.parse(saved)
    setStatus('Syncing...')

    const { error } = await supabase.from('attendance').insert(offlineQueue)
    
    if (!error) {
      localStorage.removeItem('offline_attendance')
      setPendingSync(0)
      setStatus('Sync Complete')
      setTimeout(() => setStatus('Idle'), 2000)
    } else {
      setStatus('Sync Failed - Will retry')
    }
  }

  // 3. Handle the Scan
  const processScan = async (rfidTag: string) => {
    if (!rfidTag) return

    const timestamp = new Date().toISOString()
    const record = {
      rfid_tag: rfidTag,
      status: 'Present',
      timestamp: timestamp,
      date: timestamp.split('T')[0]
    }

    if (navigator.onLine) {
      const { error } = await supabase.from('attendance').insert([record])
      if (error) {
        saveOffline(record)
      } else {
        setStatus('Success')
      }
    } else {
      saveOffline(record)
    }
    setInput('')
    // Close QR scanner if it was open
    if (showQrScanner) setShowQrScanner(false)
  }

  const saveOffline = (record: any) => {
    const current = JSON.parse(localStorage.getItem('offline_attendance') || '[]')
    current.push(record)
    localStorage.setItem('offline_attendance', JSON.stringify(current))
    setPendingSync(current.length)
    setStatus('Saved Offline')
  }

  return (
    <div className="p-8">
      {/* Network Status */}
      <div className={`fixed top-4 right-4 p-2 rounded-full flex items-center gap-2 ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
        <span className="font-bold">{isOnline ? 'Online' : 'Offline'}</span>
      </div>

      <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow-lg mt-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Scanner</h1>
          <button 
            onClick={() => setShowQrScanner(!showQrScanner)}
            className="text-blue-600 flex items-center gap-1"
          >
            <Camera size={20} /> {showQrScanner ? 'Close' : 'QR'}
          </button>
        </div>

        {/* QR Scanner Area */}
        {showQrScanner && (
          <div className="mb-4 rounded-lg overflow-hidden border-2 border-black">
            <Scanner
              onScan={(result) => {
                if (result && result.length > 0) processScan(result[0].rawValue)
              }}
            />
          </div>
        )}
        
        {/* RFID Input Field */}
        <input 
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if(e.key === 'Enter') processScan(input)
          }}
          className="w-full border p-3 rounded text-lg mb-4"
          placeholder="Click & Scan RFID..."
        />

        <div className="text-center p-4 bg-gray-50 rounded">
          STATUS: <span className="font-bold">{status}</span>
        </div>

        {/* Sync Button */}
        {pendingSync > 0 && (
          <button 
            onClick={syncOfflineData}
            className="mt-4 w-full bg-yellow-500 text-white p-3 rounded flex items-center justify-center gap-2"
          >
            <RefreshCw /> Sync {pendingSync} Records
          </button>
        )}
      </div>
    </div>
  )
}