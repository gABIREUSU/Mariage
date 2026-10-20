import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditarClientePage } from './editar-cliente.page';

describe('EditarClientePage', () => {
  let component: EditarClientePage;
  let fixture: ComponentFixture<EditarClientePage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(EditarClientePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
