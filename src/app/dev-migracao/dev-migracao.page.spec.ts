import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DevMigracaoPage } from './dev-migracao.page';

describe('DevMigracaoPage', () => {
  let component: DevMigracaoPage;
  let fixture: ComponentFixture<DevMigracaoPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(DevMigracaoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
