import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminResumen } from './admin-resumen';

describe('AdminResumen', () => {
  let component: AdminResumen;
  let fixture: ComponentFixture<AdminResumen>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminResumen],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminResumen);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
