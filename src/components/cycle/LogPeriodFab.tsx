'use client'

import { useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded'
import { createClient } from '@/lib/supabase/client'
import { insertCycle, updateCycleEnd } from '@/lib/supabase/queries/cycles'
import type { Cycle, FlowIntensity } from '@/types/index'

interface LogPeriodFabProps {
  activeCycle: Cycle | null
  onLogged: () => void
}

const todayStr = () => new Date().toISOString().split('T')[0]

const LogPeriodFab = ({ activeCycle, onLogged }: LogPeriodFabProps) => {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(todayStr())
  const [flowIntensity, setFlowIntensity] = useState<FlowIntensity | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isActive = activeCycle !== null && activeCycle.period_end === null
  const label = isActive ? 'Log period end' : 'Log period start'

  const handleOpen = () => {
    setDate(todayStr())
    setFlowIntensity(null)
    setError(null)
    setOpen(true)
  }

  const handleConfirm = async () => {
    setSaving(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      if (isActive) {
        if (date < activeCycle.period_start) {
          setError('End date must be on or after the start date.')
          setSaving(false)
          return
        }
        await updateCycleEnd(supabase, activeCycle.id, date)
      } else {
        await insertCycle(supabase, {
          user_id: user.id,
          period_start: date,
          ...(flowIntensity ? { flow_intensity: flowIntensity } : {}),
        })
      }

      setOpen(false)
      onLogged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Fab
        color="primary"
        onClick={handleOpen}
        sx={{ position: 'fixed', bottom: 'calc(72px + env(safe-area-inset-bottom))', right: 16, zIndex: 50 }}
        aria-label={label}
      >
        <CalendarTodayRoundedIcon />
      </Fab>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{label}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
          <TextField
            type="date"
            label="Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            inputProps={{ max: todayStr() }}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          {!isActive && (
            <>
              <Typography variant="caption" color="text.secondary">
                Flow intensity (optional)
              </Typography>
              <ToggleButtonGroup
                value={flowIntensity}
                exclusive
                onChange={(_, val) => setFlowIntensity(val as FlowIntensity | null)}
                size="small"
                fullWidth
              >
                <ToggleButton value="light">Light</ToggleButton>
                <ToggleButton value="medium">Medium</ToggleButton>
                <ToggleButton value="heavy">Heavy</ToggleButton>
              </ToggleButtonGroup>
            </>
          )}
          {error && (
            <Typography variant="caption" color="error">
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleConfirm} disabled={saving || !date}>
            {saving ? 'Saving…' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default LogPeriodFab
