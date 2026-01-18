import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequirementsManagementComponent } from './requirements-management.component';

describe('RequirementsManagementComponent', () => {
  let component: RequirementsManagementComponent;
  let fixture: ComponentFixture<RequirementsManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequirementsManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequirementsManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
