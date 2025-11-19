export default function AdminRoute({ adminStatus }) {
  const { loading } = useAuth();
  if (loading) return <div>Loading...</div>;

  return adminStatus ? <Outlet /> : <Navigate to="/" replace />;
}
