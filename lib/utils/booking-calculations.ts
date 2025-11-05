// lib/utils/booking-calculations.ts
export interface DistancePerks {
  free_dropoff: boolean;
  free_30min_lesson: boolean;
  free_1hr_lesson: boolean;
}

export interface PricingBreakdown {
  basePrice: number;
  pickupPrice: number;
  addonsPrice: number;
  discountAmount: number;
  totalPrice: number;
}

export const bookingUtils = {
  // Calculate pickup price based on distance
  calculatePickupPrice(distance: number): number {
    if (distance <= 50) {
      return Math.round(distance * 100); // $1/km in cents
    }
    return Math.round((50 * 100) + ((distance - 50) * 50)); // First 50km + $0.50/km for rest
  },

  // Determine free perks based on distance
  getDistancePerks(distance: number): DistancePerks {
    return {
      free_dropoff: distance >= 50,
      free_30min_lesson: distance >= 50 && distance < 100,
      free_1hr_lesson: distance >= 100
    };
  },

  // Format price from cents to display string
  formatPrice(priceInCents: number): string {
    return `$${(priceInCents / 100).toFixed(2)}`;
  },

  // Convert dollars to cents
  dollarsToCents(dollars: number): number {
    return Math.round(dollars * 100);
  },

  // Calculate total booking price
  calculateTotalPrice(breakdown: {
    basePrice: number;
    pickupPrice: number;
    addonsPrice: number;
    discountAmount?: number;
  }): number {
    const { basePrice, pickupPrice, addonsPrice, discountAmount = 0 } = breakdown;
    return Math.max(0, basePrice + pickupPrice + addonsPrice - discountAmount);
  },

  // Calculate distance between two coordinates (Haversine formula)
  calculateDistanceLocal(
    lat1: number, 
    lng1: number, 
    lat2: number, 
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  toRadians(degrees: number): number {
    return degrees * (Math.PI/180);
  }
};