import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminSolicitudes } from './admin-solicitudes';

describe('AdminSolicitudes', () => {
  let component: AdminSolicitudes;
  let fixture: ComponentFixture<AdminSolicitudes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminSolicitudes],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminSolicitudes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
