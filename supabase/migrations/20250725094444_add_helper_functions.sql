-- Useful queries for open-ODE project

-- Get user's active sessions
CREATE OR REPLACE FUNCTION get_user_active_sessions(p_user_id UUID)
RETURNS TABLE (
    session_id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    last_active TIMESTAMP WITH TIME ZONE,
    workspace_path TEXT,
    container_id TEXT,
    file_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as session_id,
        s.created_at,
        s.last_active,
        s.workspace_path,
        s.container_id,
        COUNT(DISTINCT wf.id) as file_count
    FROM public.sessions s
    LEFT JOIN public.workspace_files wf ON s.id = wf.session_id
    WHERE s.user_id = p_user_id 
    AND s.status = 'active'
    GROUP BY s.id
    ORDER BY s.last_active DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get session details with file statistics
CREATE OR REPLACE FUNCTION get_session_details(p_session_id UUID, p_user_id UUID)
RETURNS TABLE (
    session_id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    last_active TIMESTAMP WITH TIME ZONE,
    workspace_path TEXT,
    container_id TEXT,
    status TEXT,
    total_files BIGINT,
    files_created BIGINT,
    files_modified BIGINT,
    files_deleted BIGINT,
    total_size_bytes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as session_id,
        s.created_at,
        s.last_active,
        s.workspace_path,
        s.container_id,
        s.status,
        COUNT(DISTINCT wf.id) as total_files,
        COUNT(DISTINCT CASE WHEN wf.operation = 'created' THEN wf.id END) as files_created,
        COUNT(DISTINCT CASE WHEN wf.operation = 'modified' THEN wf.id END) as files_modified,
        COUNT(DISTINCT CASE WHEN wf.operation = 'deleted' THEN wf.id END) as files_deleted,
        COALESCE(SUM(wf.size_bytes), 0) as total_size_bytes
    FROM public.sessions s
    LEFT JOIN public.workspace_files wf ON s.id = wf.session_id
    WHERE s.id = p_session_id 
    AND s.user_id = p_user_id
    GROUP BY s.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get workspace files for a session
CREATE OR REPLACE FUNCTION get_session_files(p_session_id UUID, p_user_id UUID)
RETURNS TABLE (
    file_id UUID,
    file_path TEXT,
    file_name TEXT,
    file_type TEXT,
    operation TEXT,
    size_bytes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wf.id as file_id,
        wf.file_path,
        wf.file_name,
        wf.file_type,
        wf.operation,
        wf.size_bytes,
        wf.created_at,
        wf.updated_at
    FROM public.workspace_files wf
    INNER JOIN public.sessions s ON wf.session_id = s.id
    WHERE wf.session_id = p_session_id 
    AND s.user_id = p_user_id
    ORDER BY wf.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Terminate inactive sessions (can be called periodically)
CREATE OR REPLACE FUNCTION terminate_inactive_sessions(p_inactive_hours INTEGER DEFAULT 24)
RETURNS INTEGER AS $$
DECLARE
    terminated_count INTEGER;
BEGIN
    UPDATE public.sessions
    SET status = 'inactive'
    WHERE status = 'active'
    AND last_active < (NOW() - INTERVAL '1 hour' * p_inactive_hours);
    
    GET DIAGNOSTICS terminated_count = ROW_COUNT;
    RETURN terminated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user statistics
CREATE OR REPLACE FUNCTION get_user_statistics(p_user_id UUID)
RETURNS TABLE (
    total_sessions BIGINT,
    active_sessions BIGINT,
    total_files_created BIGINT,
    total_storage_bytes BIGINT,
    first_session_date TIMESTAMP WITH TIME ZONE,
    last_active_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT s.id) as total_sessions,
        COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) as active_sessions,
        COUNT(DISTINCT wf.id) as total_files_created,
        COALESCE(SUM(wf.size_bytes), 0) as total_storage_bytes,
        MIN(s.created_at) as first_session_date,
        MAX(s.last_active) as last_active_date
    FROM public.sessions s
    LEFT JOIN public.workspace_files wf ON s.id = wf.session_id
    WHERE s.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search files across all user sessions
CREATE OR REPLACE FUNCTION search_user_files(
    p_user_id UUID,
    p_search_term TEXT,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    file_id UUID,
    session_id UUID,
    file_path TEXT,
    file_name TEXT,
    file_type TEXT,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wf.id as file_id,
        wf.session_id,
        wf.file_path,
        wf.file_name,
        wf.file_type,
        wf.updated_at
    FROM public.workspace_files wf
    WHERE wf.user_id = p_user_id
    AND (
        wf.file_path ILIKE '%' || p_search_term || '%'
        OR wf.file_name ILIKE '%' || p_search_term || '%'
        OR wf.content ILIKE '%' || p_search_term || '%'
    )
    ORDER BY wf.updated_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_user_active_sessions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_session_details(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_session_files(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION terminate_inactive_sessions(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_statistics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION search_user_files(UUID, TEXT, INTEGER) TO authenticated;