import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StudentNavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-student-layout',
  standalone: true,
  imports: [RouterOutlet, StudentNavbarComponent],
  templateUrl: './student-layout.component.html',
  styleUrl: './student-layout.component.css'
})
export class StudentLayoutComponent {

}
