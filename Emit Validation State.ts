// dynamic-XXXXX.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-dynamic-XXXXX',
  template: `
    <label>{{ label }}</label>
    <input [formControl]="control" (input)="emitValidationState()" />
    <div *ngIf="control.invalid && control.touched">
      {{ getValidationMessage() }}
    </div>
    </div>
  `
})
export class DynamicXXXXXComponent implements OnInit {
  @Input() label!: string;
  @Input() control!: FormControl;

  @Output() validationState = new EventEmitter<{ valid: boolean; message?: string }>();

  ngOnInit() {
    this.emitValidationState();
    this.control.valueChanges.subscribe(() => this.emitValidationState());
  }

  emitValidationState() {
    this.validationState.emit({
      valid: this.control.valid,
      message: this.control.invalid ? this.getValidationMessage() : undefined
    });
  }

  getValidationMessage(): string {
    if (this.control.hasError('required')) return 'Required';
    if (this.control.hasError('minlength')) return 'Too short';
    return 'Invalid';
  }
}
2. Host Component Creates Dynamically
ts
Copy
Edit
// host.component.ts
import {
  Component,
  ViewChild,
  ViewContainerRef,
  ComponentRef,
  AfterViewInit,
  Injector
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DynamicXXXXXComponent } from './dynamic-XXXXX.component';

@Component({
  selector: 'app-host',
  template: `
    <form [formGroup]="form">
      <div #container></div>
    </form>
    <div *ngIf="!allValid">Some XXXXXs are invalid!</div>
  `
})
export class HostComponent implements AfterViewInit {
  @ViewChild('container', { read: ViewContainerRef }) container!: ViewContainerRef;

  form = new FormGroup({});
  validationStates: Record<string, boolean> = {};

  constructor(private injector: Injector) {}

  ngAfterViewInit(): void {
    this.addDynamicXXXXX('name', 'Your Name', [Validators.required]);
    this.addDynamicXXXXX('email', 'Your Email', [Validators.required, Validators.email]);
  }

  addDynamicXXXXX(controlName: string, label: string, validators: any[]) {
    const control = new FormControl('', validators);
    this.form.addControl(controlName, control);

    const ref: ComponentRef<DynamicXXXXXComponent> = this.container.createComponent(
      DynamicXXXXXComponent,
      { injector: this.injector }
    );

    ref.setInput('label', label);
    ref.setInput('control', control);

    ref.instance.validationState.subscribe((state) => {
      this.validationStates[controlName] = state.valid;
    });
  }

  get allValid(): boolean {
    return Object.values(this.validationStates).every(valid => valid);
  }
}
✅ Summary:
Each dynamically added component emits validation state via an EventEmitter.

The host component manually subscribes to each ComponentRef.instance.validationState.

Validation states are tracked in a dictionary.

allValid reflects current aggregate validity across all children.

child components emit multiple outputs (e.g. touched, error messages) — we can extend the pattern.
#-------------------------------------------------------------
 const ref: ComponentRef<DynamicXXXXXComponent> = this.container.createComponent(
      DynamicXXXXXComponent,
      { injector: this.injector }
    );    
can be used as a unique key?
Yes, in Angular, the result of createComponent() — the ComponentRef<DynamicXXXXXComponent> — can be used as a unique key within the same session/lifecycle, because each call to createComponent() creates a new instance of the component.
✅ Example Use Cases:
You can use the ref:
as a key in a Map<ComponentRef<any>, ValidationState>
to track component instances and metadata
to destroy or update components later
✅ Example:
ts
Copy
Edit
const ref: ComponentRef<DynamicXXXXXComponent> = this.container.createComponent(
  DynamicXXXXXComponent,
  { injector: this.injector }
);
// Use ref as a key
this.validationMap.set(ref, { valid: false });
// Later you can update it:
ref.instance.validationState.subscribe((state) => {
  this.validationMap.set(ref, state);
});
⚠️ Caution:
Do not serialize ComponentRef — it’s a complex object with runtime context.
Only use it as a reference within memory (runtime) — not for saving to storage or passing to other systems.
✅ If You Need Persistent Keys:
If you need to track validation by component identity across time, it's better to also track a logical key like:
ts
Copy
Edit
interface ComponentMeta {
  ref: ComponentRef<any>;
  controlName: string;
}
Map<ComponentRef<any>, something>.
