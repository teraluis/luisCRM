import {Component, OnInit, ViewChild, ElementRef, AfterViewInit} from '@angular/core';
import {} from 'googlemaps';





@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterViewInit {

  @ViewChild('mapWrapper') mapElement: ElementRef;
  map: google.maps.Map;




  initializeMap() {
    const lngLat = new google.maps.LatLng(6.5874964, 3.9886097);
    const mapOptions: google.maps.MapOptions = {
      center: lngLat,
      zoom: 16,
      fullscreenControl: false,
      mapTypeControl: false,
      streetViewControl: false
    };
    this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);
  }

  ngAfterViewInit() {
    this.initializeMap();
  }

}
