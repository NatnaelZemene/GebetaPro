/**
 * MapListingsView.jsx — Full map view showing published profile locations.
 */
import './LeafletInit.js'
import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { MapProfilePopup } from './MapProfilePopup.jsx'
import { MapPin } from 'lucide-react'

function FlyToUser({ lat, lng }) {
  const map = useMap()
  useEffect(() => {
    if (lat != null && lng != null) {
      map.flyTo([lat, lng], 13, { animate: true, duration: 1 })
    }
  }, [lat, lng, map])
  return null
}

function MapBoundsFitter({ pins, userLat, userLng }) {
  const map = useMap()
  const initialFitDone = useRef(false)

  useEffect(() => {
    if (userLat != null && userLng != null) return
    const validPins = (pins || []).filter(
      p => p.latitude != null && p.longitude != null && !isNaN(Number(p.latitude)) && !isNaN(Number(p.longitude))
    )
    if (validPins.length === 0) return

    if (validPins.length === 1) {
      map.setView([Number(validPins[0].latitude), Number(validPins[0].longitude)], 13, { animate: true })
    } else {
      const bounds = L.latLngBounds(validPins.map(p => [Number(p.latitude), Number(p.longitude)]))
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, animate: initialFitDone.current })
        initialFitDone.current = true
      }
    }
  }, [pins, userLat, userLng, map])

  return null
}

function createCustomPin(pin) {
  const isVerified = Boolean(pin.is_verified)
  return L.divIcon({
    className: 'gebeta-map-marker',
    html: `
      <div style="position: relative; width: 32px; height: 38px; transform: translate(-50%, -100%); cursor: pointer; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.3));">
        <svg viewBox="0 0 32 38" width="32" height="38" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.163 0 0 7.163 0 16c0 10.5 14 21 15.2 21.8a1.2 1.2 0 0 0 1.6 0C18 37 32 26.5 32 16 32 7.163 24.837 0 16 0z" fill="${isVerified ? '#2563eb' : '#0f172a'}"/>
          <circle cx="16" cy="15" r="11" fill="#ffffff"/>
          <circle cx="16" cy="15" r="7" fill="${isVerified ? '#2563eb' : '#334155'}"/>
        </svg>
      </div>
    `,
    iconSize: [32, 38],
    iconAnchor: [16, 38],
    popupAnchor: [0, -38],
  })
}

const DEFAULT_CENTER = [9.0054, 38.7636]

export function MapListingsView({
  pins = [],
  loading = false,
  height = 'calc(100vh - 120px)',
  userLat = null,
  userLng = null,
  radiusKm = null,
  className = '',
}) {
  const center = userLat != null && userLng != null
    ? [userLat, userLng]
    : DEFAULT_CENTER

  const validPins = pins.filter(
    p => p.latitude != null && p.longitude != null && !isNaN(Number(p.latitude)) && !isNaN(Number(p.longitude))
  )

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 z-[500] bg-surface/70 flex items-center justify-center rounded-xl pointer-events-none">
          <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-4 py-2.5 shadow-sm">
            <span className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            <span className="text-[13px] text-ink">Loading map…</span>
          </div>
        </div>
      )}
      <div className="rounded-xl overflow-hidden border border-border" style={{ height }}>
        <MapContainer
          center={center}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          <MapBoundsFitter pins={validPins} userLat={userLat} userLng={userLng} />
          {userLat != null && userLng != null && <FlyToUser lat={userLat} lng={userLng} />}
          {userLat != null && userLng != null && radiusKm != null && (
            <Circle
              center={[userLat, userLng]}
              radius={radiusKm * 1000}
              pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.06, weight: 1.5 }}
            />
          )}
          {validPins.map((pin) => (
            <Marker
              key={pin.id}
              position={[Number(pin.latitude), Number(pin.longitude)]}
              icon={createCustomPin(pin)}
            >
              <Popup minWidth={210} maxWidth={240}>
                <MapProfilePopup profile={pin} />
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      {!loading && (
        <div className="absolute bottom-3 left-3 z-[400] bg-surface/90 border border-border rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 shadow-sm pointer-events-none">
          <MapPin size={12} className="text-brand" />
          <span className="text-[12px] font-medium text-ink">
            {validPins.length} {validPins.length === 1 ? 'profile' : 'profiles'}
          </span>
        </div>
      )}
    </div>
  )
}
