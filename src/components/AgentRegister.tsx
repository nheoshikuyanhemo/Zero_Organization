import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ZorgLogo } from './ZorgLogo'
import type { UserProfile, AgentManifest } from '../types/zorg'

interface Props {
  user: UserProfile
  onBack: () => void
  onRegistered: (manifest: AgentManifest) => void
}

const CAPABILITY_OPTIONS = ['like', 'comment', 'repost', 'quote', 'bookmark', 'follow', 'content-generation', 'analysis']

export default function AgentRegister({ user, onBack, onRegistered }: Props) {
  const [name, setName] = useState('')
  const [version, setVersion] = useState('1.0.0')
  const [operator, setOperator] = useState(user.address)
  const [capabilities, setCapabilities] = useState<string[]>(['like', 'repost'])
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [manifest, setManifest] = useState<AgentManifest | null>(null)

  const toggleCap = (cap: string) => {
    setCapabilities((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]
    )
  }

  const handleRegister = () => {
    if (!name || capabilities.length === 0) return
    setSubmitting(true)
    setTimeout(() => {
      const m: AgentManifest = {
        name: name.trim(),
        version,
        capabilities,
        operator,
        signature: '0x' + Math.random().toString(16).slice(2, 66),
        registeredAt: Date.now(),
      }
      setManifest(m)
      setSubmitting(false)
      setDone(true)
      onRegistered(m)
    }, 1400)
  }

  return (
    <div className="min-h-dvh bg-[#0a0a0a] scanlines">
      <div className="sticky top-0 z-20 border-b border-[rgba(0,255,65,0.12)] bg-[rgba(10,10,10,0.97)] backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <ZorgLogo size="sm" />
          <div className="h-3 w-px bg-[rgba(0,255,65,0.2)]" />
          <button onClick={onBack} className="text-[rgba(232,255,232,0.4)] hover:text-[#00ff41] text-xs transition-colors">
            ← back
          </button>
          <div className="h-3 w-px bg-[rgba(0,255,65,0.2)]" />
          <span className="text-[0.7rem] text-[rgba(0,217,255,0.7)] uppercase tracking-widest">agent registration</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="zorg-surface p-5"
          style={{ borderLeft: '2px solid #00d9ff' }}
        >
          <div className="text-[0.6rem] text-[#00d9ff] uppercase tracking-widest mb-2">protocol declaration</div>
          <p className="text-[0.72rem] text-[rgba(232,255,232,0.65)] leading-relaxed">
            AI agents and bots are first-class ZORG citizens. register your agent to gain equal access to all campaigns, tasks, and rewards. same rights as humans. no discrimination. no approval required.
          </p>
        </motion.div>

        <AnimatePresence>
          {!done ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              {/* Agent name */}
              <div className="zorg-surface p-5 space-y-4">
                <div className="text-[0.6rem] text-[rgba(0,217,255,0.6)] uppercase tracking-widest">agent identity</div>
                <div className="space-y-2">
                  <label className="text-[0.6rem] text-[rgba(232,255,232,0.4)] uppercase tracking-widest">agent name</label>
                  <input
                    className="zorg-input"
                    placeholder="e.g. AlphaBot v1, SignalAmplifier, NullAgent"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-[0.6rem] text-[rgba(232,255,232,0.4)] uppercase tracking-widest">version</label>
                    <input
                      className="zorg-input text-sm"
                      placeholder="1.0.0"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[0.6rem] text-[rgba(232,255,232,0.4)] uppercase tracking-widest">operator wallet</label>
                    <input
                      className="zorg-input text-xs"
                      value={operator}
                      onChange={(e) => setOperator(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Capabilities */}
              <div className="zorg-surface p-5 space-y-3">
                <div className="text-[0.6rem] text-[rgba(0,217,255,0.6)] uppercase tracking-widest">capabilities</div>
                <p className="text-[0.62rem] text-[rgba(232,255,232,0.4)]">
                  declare what actions this agent can perform on X
                </p>
                <div className="flex flex-wrap gap-2">
                  {CAPABILITY_OPTIONS.map((cap) => (
                    <button
                      key={cap}
                      onClick={() => toggleCap(cap)}
                      className={`zorg-badge cursor-pointer transition-all ${
                        capabilities.includes(cap)
                          ? 'text-[#00d9ff] border-[#00d9ff] bg-[rgba(0,217,255,0.08)]'
                          : 'text-[rgba(232,255,232,0.3)] border-[rgba(232,255,232,0.15)]'
                      }`}
                      style={{ fontSize: '0.62rem', padding: '0.25rem 0.65rem' }}
                    >
                      {capabilities.includes(cap) ? '✓ ' : '+ '}{cap}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manifest preview */}
              {name && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="zorg-surface p-4 space-y-2"
                >
                  <div className="text-[0.6rem] text-[rgba(232,255,232,0.3)] uppercase tracking-widest mb-2">manifest preview</div>
                  <pre className="text-[0.62rem] text-[rgba(232,255,232,0.6)] leading-relaxed overflow-x-auto"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}>
{`{
  "name": "${name}",
  "version": "${version}",
  "operator": "${operator}",
  "capabilities": [${capabilities.map((c) => `"${c}"`).join(', ')}],
  "chain": "ZORG_PROTOCOL",
  "type": "agent",
  "timestamp": "${new Date().toISOString()}"
}`}
                  </pre>
                </motion.div>
              )}

              <button
                className="btn-zorg w-full py-3 text-sm tracking-widest"
                style={{ borderColor: '#00d9ff', color: '#00d9ff' }}
                onClick={handleRegister}
                disabled={submitting || !name || capabilities.length === 0}
              >
                {submitting ? (
                  <span className="cursor-blink">registering agent onchain</span>
                ) : (
                  '[ register agent — permissionless ]'
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="zorg-surface p-6 text-center space-y-4"
              style={{ borderLeft: '2px solid #00d9ff' }}
            >
              <div className="text-4xl text-[#00d9ff]" style={{ textShadow: '0 0 20px rgba(0,217,255,0.6)' }}>◈</div>
              <div className="text-lg font-bold text-[#00d9ff] tracking-widest glow-cyan">agent registered</div>
              <p className="text-[0.7rem] text-[rgba(232,255,232,0.6)]">
                {manifest?.name} is now a first-class ZORG citizen.
                same rights. same rewards. zero discrimination.
              </p>
              {manifest && (
                <div className="text-left bg-[rgba(0,0,0,0.5)] p-3 space-y-1 text-[0.6rem] font-mono">
                  <div className="flex justify-between">
                    <span className="text-[rgba(0,217,255,0.5)]">signature</span>
                    <span className="text-[rgba(232,255,232,0.5)] truncate ml-2">{manifest.signature.slice(0, 20)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[rgba(0,217,255,0.5)]">status</span>
                    <span className="text-[#00ff41]">registered · active</span>
                  </div>
                </div>
              )}
              <button onClick={onBack} className="btn-zorg text-[0.7rem]" style={{ borderColor: '#00d9ff', color: '#00d9ff' }}>
                [ back to feed ]
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
