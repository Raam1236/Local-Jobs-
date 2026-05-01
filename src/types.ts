export type UserRole = 'worker' | 'employer' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  isVerified?: boolean;
  averageRating?: number;
  ratingCount?: number;
  skills?: string[];
  location?: {
    lat: number;
    lng: number;
    state?: string;
    district?: string;
    village?: string;
    pincode?: string;
  };
  phone?: string;
  isAvailableToday?: boolean;
  isPremium?: boolean;
  viewedContactIds?: string[];
  bio?: string;
  profileImageUrl?: string;
  languages?: string[];
  referralCode?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  targetId: string;
  targetType: 'user' | 'job';
  reason: string;
  details: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export type NotificationType = 'job_application' | 'application_status' | 'new_review' | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
  read: boolean;
  createdAt: string;
}

export type JobStatus = 'open' | 'closed';

export interface Job {
  id: string;
  title: string;
  description: string;
  payment: string;
  workersNeeded?: number;
  location: {
    lat: number;
    lng: number;
  };
  locationName: string;
  state?: string;
  district?: string;
  village?: string;
  pincode?: string;
  employerId: string;
  employerName: string;
  category: string;
  time: string;
  status: JobStatus;
  createdAt: string;
}

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export interface Application {
  id: string;
  jobId: string;
  workerId: string;
  workerName: string;
  employerId: string;
  status: ApplicationStatus;
  createdAt: string;
}

export interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewText: string;
  rating: number;
  createdAt: string;
}
