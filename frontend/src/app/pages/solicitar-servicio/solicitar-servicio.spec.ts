import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SolicitarServicio } from './solicitar-servicio';

describe('SolicitarServicio', () => {
  let component: SolicitarServicio;
  let fixture: ComponentFixture<SolicitarServicio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolicitarServicio],
    }).compileComponents();

    fixture = TestBed.createComponent(SolicitarServicio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
