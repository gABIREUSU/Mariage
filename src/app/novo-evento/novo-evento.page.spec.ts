import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NovoEventoPage } from './novo-evento.page';

describe('NovoEventoPage', () => {
  let component: NovoEventoPage;
  let fixture: ComponentFixture<NovoEventoPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(NovoEventoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
