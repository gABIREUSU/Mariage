import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NovoClientePage } from './novo-cliente.page';

describe('NovoClientePage', () => {
  let component: NovoClientePage;
  let fixture: ComponentFixture<NovoClientePage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(NovoClientePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
