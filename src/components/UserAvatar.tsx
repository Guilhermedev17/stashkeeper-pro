
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

const UserAvatar = () => {
  const { user } = useAuth();
  
  if (!user) return null;
  
  // Get user's name from metadata, or use email as fallback
  const userName = user.user_metadata?.name || user.email || '';
  
  const initials = userName
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <Avatar className="h-9 w-9 transition-all duration-300 hover:ring-2 hover:ring-primary">
      <AvatarFallback className="bg-primary text-primary-foreground">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
