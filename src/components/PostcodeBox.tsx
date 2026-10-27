// The postcode box: on a first visit, and after "Change". What's typed is looked up in
// the bundled list and never sent anywhere (SPEC §2).

import { useState, type FormEvent } from 'react'
import { district, outwardCode, type District } from '../lib/postcode.ts'

export function PostcodeBox({ onChoose, onCancel }: { onChoose: (d: District) => void; onCancel?: () => void }) {
  const [typed, setTyped] = useState('')
  const [error, setError] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    const code = outwardCode(typed)
    if (!typed.trim()) return setError('Type a postcode first.')
    if (!code) return setError("That doesn't look like a postcode. Try one like RG1 or RG1 8FR.")
    const d = district(code)
    // Wales, Scotland, Northern Ireland, the Channel Islands and the Isle of Man alike, as Hindcaster.
    if (!d) return setError(`Only England postcodes are currently accepted. ${code} isn't a postcode district in England.`)
    onChoose(d)
  }

  return (
    <form className="field postcode-box" onSubmit={submit} noValidate>
      <label htmlFor="pc">Your postcode, or just its first half</label>
      <div className="choose-row">
        <input
          className="input" id="pc" value={typed} autoComplete="postal-code" placeholder="RG1 or RG1 8FR"
          aria-invalid={error ? true : undefined} aria-describedby={error ? 'pc-error' : undefined}
          autoCapitalize="characters" autoCorrect="off" spellCheck={false} enterKeyHint="go" autoFocus={!!onCancel}
          onChange={(e) => { setTyped(e.target.value); if (error) setError('') }}
        />
        <button className="btn btn-primary" type="submit">Show</button>
        {onCancel && <button className="btn btn-secondary" type="button" onClick={onCancel}>Cancel</button>}
      </div>
      {error && <div className="choose-error" id="pc-error" role="alert">{error}</div>}
      <div className="note">Only the first half (RG1) is used. Saved on this device only: nothing you type is sent anywhere.</div>
    </form>
  )
}
