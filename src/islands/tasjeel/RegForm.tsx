/* Step two: the registration form. Arabic messages sit under each field,
   submitting with errors moves focus to the first one, and after the first
   attempt every field re-checks as the visitor types. Stage and grade are
   linked; the details field shows only when the answer is yes. */
import type { RefObject } from 'preact';
import { useRef, useState } from 'preact/hooks';
import { example, stages, ui, type StageKey, type YesNo } from '../../data/tasjeel';
import { ORDER, countText, emptyForm, validate, type Errors, type Field, type Form } from './store';

const F = ui.form;

interface Props {
  head: RefObject<HTMLHeadingElement | null>;
  onBack: () => void;
  onDone: (first: string) => void;
  onSay: (s: string) => void;
}

export function RegForm({ head, onBack, onDone, onSay }: Props) {
  const [form, setForm] = useState<Form>(emptyForm);
  const [errors, setErrors] = useState<Errors>({});
  const [tried, setTried] = useState(false);
  const refs = useRef<Partial<Record<Field, HTMLElement | null>>>({});
  const reg = (k: Field) => (el: HTMLElement | null) => {
    if (el) refs.current[k] = el;
  };

  const set = (patch: Partial<Form>) => {
    const next = { ...form, ...patch };
    setForm(next);
    if (tried) setErrors(validate(next));
  };

  const submit = (ev: Event) => {
    ev.preventDefault();
    const e = validate(form);
    setTried(true);
    setErrors(e);
    const bad = ORDER.filter((k) => e[k]);
    if (bad.length) {
      onSay(F.errorsSaid(countText(bad.length)));
      // wait for the conditional fields to render, then focus the first error
      requestAnimationFrame(() => refs.current[bad[0]]?.focus());
      return;
    }
    onDone(form.name.trim().split(/\s+/)[0]);
  };

  const fill = () => {
    const next: Form = { ...example };
    setForm(next);
    if (tried) setErrors(validate(next));
    onSay(F.filled);
  };

  const stage = stages.find((s) => s.key === form.stage);
  const err = (k: Field) => errors[k];
  const described = (k: Field) => (errors[k] ? `tj-${k}-err` : undefined);
  const msg = (k: Field) =>
    errors[k] ? <p class="tj-err" id={`tj-${k}-err`}>{errors[k]}</p> : null;

  const text = (k: 'name' | 'nid' | 'phone' | 'district' | 'allergyText', numeric = false) => (
    <div class={`tj-field${err(k) ? ' is-bad' : ''}`}>
      <label for={`tj-${k}`}>{F.labels[k]}</label>
      <input
        id={`tj-${k}`}
        ref={reg(k)}
        type="text"
        inputMode={numeric ? 'numeric' : undefined}
        autoComplete="off"
        spellcheck={false}
        maxLength={numeric ? 12 : 60}
        placeholder={F.placeholders[k]}
        value={form[k]}
        aria-invalid={err(k) ? 'true' : undefined}
        aria-describedby={described(k)}
        onInput={(e) => set({ [k]: (e.currentTarget as HTMLInputElement).value } as Partial<Form>)}
      />
      {msg(k)}
    </div>
  );

  return (
    <section class="tj-form" aria-labelledby="tj-h">
      <div class="tj-form__head">
        <h3 class="tj-h" id="tj-h" tabIndex={-1} ref={head}>{F.title}</h3>
        <button type="button" class="tj-chip tj-chip--fill" onClick={fill}>{F.fill}</button>
      </div>
      <p class="tj-demo">{F.demo}</p>

      <form class="tj-fields" noValidate onSubmit={submit}>
        {text('name')}
        <div class="tj-pair">
          {text('nid', true)}
          {text('phone', true)}
        </div>

        <fieldset class={`tj-group${err('stage') ? ' is-bad' : ''}`} aria-describedby={described('stage')}>
          <legend>{F.labels.stage}</legend>
          <div class="tj-opts tj-opts--3">
            {stages.map((s, i) => (
              <label class="tj-opt" key={s.key}>
                <input
                  type="radio"
                  name="tj-stage"
                  ref={i === 0 ? reg('stage') : undefined}
                  checked={form.stage === s.key}
                  onChange={() => set({ stage: s.key as StageKey, grade: -1 })}
                />
                <span>{s.label}</span>
              </label>
            ))}
          </div>
          {msg('stage')}
        </fieldset>

        <fieldset class={`tj-group${err('grade') ? ' is-bad' : ''}`} aria-describedby={described('grade')} disabled={!stage}>
          <legend>{F.labels.grade}</legend>
          {stage ? (
            <div class="tj-opts tj-opts--3">
              {stage.grades.map((g, i) => (
                <label class="tj-opt" key={`${stage.key}-${g}`}>
                  <input
                    type="radio"
                    name="tj-grade"
                    ref={i === 0 ? reg('grade') : undefined}
                    checked={form.grade === i}
                    onChange={() => set({ grade: i })}
                  />
                  <span>{g}</span>
                </label>
              ))}
            </div>
          ) : (
            <p class="tj-hint">{F.gradeFirst}</p>
          )}
          {msg('grade')}
        </fieldset>

        {text('district')}

        <fieldset class={`tj-group${err('allergy') ? ' is-bad' : ''}`} aria-describedby={described('allergy')}>
          <legend>{F.labels.allergy}</legend>
          <div class="tj-opts tj-opts--2">
            {(['no', 'yes'] as YesNo[]).map((v, i) => (
              <label class="tj-opt" key={v}>
                <input
                  type="radio"
                  name="tj-allergy"
                  ref={i === 0 ? reg('allergy') : undefined}
                  checked={form.allergy === v}
                  onChange={() => set({ allergy: v, allergyText: v === 'no' ? '' : form.allergyText })}
                />
                <span>{F[v]}</span>
              </label>
            ))}
          </div>
          {msg('allergy')}
        </fieldset>
        {form.allergy === 'yes' && text('allergyText')}

        <div class="tj-actions">
          <button type="submit" class="tj-btn tj-btn--go">{F.submit}</button>
          <button type="button" class="tj-btn tj-btn--plain" onClick={onBack}>{F.back}</button>
        </div>
      </form>
    </section>
  );
}
