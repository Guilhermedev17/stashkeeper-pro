import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const UserAvatar = ({ className, size = 'md' }: UserAvatarProps = {}) => {
  const { user } = useAuth();
  
  if (!user) return null;
  
  // Get user's name from metadata, or use email as fallback
  const userName = user.user_metadata?.name || user.email || '';
  
  const initials = userName
    .split(' ')
    .map(part => part?.[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .substring(0, 2);
    
  const avatarUrl = user.user_metadata?.avatar_url;
  
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-12 w-12 text-base'
  };

  return (
    <Avatar 
      className={cn(
        sizeClasses[size],
        "transition-all duration-300 hover:ring-2 hover:ring-primary ring-offset-2 ring-offset-background",
        className
      )}
    >
      {avatarUrl && <AvatarImage src={avatarUrl} alt={userName} />}
      <AvatarFallback className="bg-primary text-primary-foreground">
        {initials || '?'}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
