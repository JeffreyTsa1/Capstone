import pytest
import mongomock
import sys
import os
import json
from unittest.mock import patch, MagicMock
from bson import ObjectId

# Add the parent directory to the Python path to import backend
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import backend

@pytest.fixture
def app():
    """Create a test Flask app."""
    backend.app.config['TESTING'] = True
    return backend.app

@pytest.fixture
def client(app):
    """Create a test client for the Flask app."""
    return app.test_client()

@pytest.fixture
def mock_mongo_client():
    """Fixture to mock MongoDB client."""
    with mongomock.patch() as mock_client:
        yield mock_client

@pytest.fixture
def mock_collections():
    """Fixture to mock MongoDB collections."""
    with patch('backend.reportCollection') as mock_reports, \
         patch('backend.userCollection') as mock_users, \
         patch('backend.moderatorCollection') as mock_moderators:
        
        # Create mock collection objects
        mock_reports.find = MagicMock(return_value=[])
        mock_reports.find_one = MagicMock(return_value=None)
        mock_reports.insert_one = MagicMock(return_value=MagicMock(acknowledged=True, inserted_id=ObjectId()))
        mock_reports.update_one = MagicMock(return_value=MagicMock(modified_count=1, matched_count=1))
        
        mock_users.find = MagicMock(return_value=[])
        mock_users.find_one = MagicMock(return_value=None)
        mock_users.insert_one = MagicMock(return_value=MagicMock(acknowledged=True, inserted_id=ObjectId()))
        mock_users.update_one = MagicMock(return_value=MagicMock(modified_count=1, matched_count=1))
        
        mock_moderators.find = MagicMock(return_value=[])
        mock_moderators.find_one = MagicMock(return_value=None)
        mock_moderators.insert_one = MagicMock(return_value=MagicMock(acknowledged=True, inserted_id=ObjectId()))
        mock_moderators.update_one = MagicMock(return_value=MagicMock(modified_count=1, matched_count=1))
        
        yield {
            'reports': mock_reports,
            'users': mock_users,
            'moderators': mock_moderators
        }

@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        "userID": "test_user_123",
        "email": "test@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "location": {"type": "Point", "coordinates": [-123.1207, 49.2827]},
        "verified": True,
        "address": "123 Test St",
        "trustScore": 75
    }

@pytest.fixture
def sample_report_data():
    """Sample report data for testing."""
    return {
        "userId": "test_user_123",
        "location": {"latitude": 49.2827, "longitude": -123.1207, "accuracy": 10},
        "radiusMeters": 250,
        "type": "smoke",
        "severity": "moderate",
        "description": "Test fire report",
        "metadata": {"source": "test"}
    }

@pytest.fixture
def sample_moderator_data():
    """Sample moderator data for testing."""
    return {
        "userID": "mod_user_123",
        "email": "moderator@example.com",
        "firstName": "Jane",
        "lastName": "Smith",
        "location": {"type": "Point", "coordinates": [-123.1207, 49.2827]},
        "verified": True,
        "address": "456 Mod St",
        "trustScore": 95,
        "status": "active"
    }

# ========== USER TESTS ==========

def test_create_user_success(client, mock_collections, sample_user_data):
    """Test successful user creation."""
    response = client.post('/users/create', 
                          data=json.dumps(sample_user_data),
                          content_type='application/json')
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert "User created successfully" in data["message"]
    assert "userID" in data
    mock_collections['users'].insert_one.assert_called_once()

def test_create_user_no_data(client, mock_collections):
    """Test user creation with no data."""
    response = client.post('/users/create',
                          data=json.dumps({}),
                          content_type='application/json')
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert "No data provided" in data["error"]

def test_create_user_database_error(client, mock_collections, sample_user_data):
    """Test user creation with database error."""
    mock_collections['users'].insert_one.return_value.acknowledged = False
    
    response = client.post('/users/create',
                          data=json.dumps(sample_user_data),
                          content_type='application/json')
    
    assert response.status_code == 500
    data = json.loads(response.data)
    assert "Failed to create user" in data["error"]

def test_update_user_success(client, mock_collections):
    """Test successful user update."""
    # Mock existing user
    mock_collections['users'].find_one.return_value = {"userID": "test_user_123"}
    
    update_data = {
        "userID": "test_user_123",
        "firstName": "UpdatedName"
    }
    
    response = client.patch('/users/update',
                           data=json.dumps(update_data),
                           content_type='application/json')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "User updated successfully" in data["message"]

def test_update_user_no_userid(client, mock_collections):
    """Test user update without userID."""
    response = client.patch('/users/update',
                           data=json.dumps({"firstName": "Test"}),
                           content_type='application/json')
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert "No user ID provided" in data["error"]

def test_update_user_invalid_userid(client, mock_collections):
    """Test user update with invalid userID."""
    mock_collections['users'].find_one.return_value = None
    
    update_data = {"userID": "invalid_user"}
    response = client.patch('/users/update',
                           data=json.dumps(update_data),
                           content_type='application/json')
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert "Invalid user ID" in data["error"]

# ========== MODERATOR TESTS ==========

def test_create_moderator_success(client, mock_collections, sample_moderator_data):
    """Test successful moderator creation."""
    response = client.post('/moderators/create',
                          data=json.dumps(sample_moderator_data),
                          content_type='application/json')
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert "Moderator created successfully" in data["message"]
    assert "userID" in data
    mock_collections['moderators'].insert_one.assert_called_once()

def test_create_moderator_no_data(client, mock_collections):
    """Test moderator creation with no data."""
    response = client.post('/moderators/create',
                          data=json.dumps({}),
                          content_type='application/json')
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert "No data provided" in data["error"]

def test_disable_moderator_success(client, mock_collections):
    """Test successful moderator disabling."""
    # Mock existing moderator
    mock_collections['moderators'].find_one.return_value = {"userID": "mod_user_123"}
    
    disable_data = {"userID": "mod_user_123"}
    response = client.patch('/moderators/disable',
                           data=json.dumps(disable_data),
                           content_type='application/json')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "Moderator disabled successfully" in data["message"]

def test_disable_moderator_no_userid(client, mock_collections):
    """Test moderator disabling without userID."""
    response = client.patch('/moderators/disable',
                           data=json.dumps({}),
                           content_type='application/json')
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert "No user ID provided" in data["error"]

def test_disable_moderator_invalid_userid(client, mock_collections):
    """Test moderator disabling with invalid userID."""
    mock_collections['moderators'].find_one.return_value = None
    
    disable_data = {"userID": "invalid_mod"}
    response = client.patch('/moderators/disable',
                           data=json.dumps(disable_data),
                           content_type='application/json')
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert "Invalid user ID" in data["error"]

# ========== REPORT TESTS ==========

def test_get_all_reports_success(client, mock_collections):
    """Test getting all reports."""
    mock_reports = [
        {"_id": ObjectId(), "userId": "user1", "type": "smoke"},
        {"_id": ObjectId(), "userId": "user2", "type": "fire"}
    ]
    mock_collections['reports'].find.return_value = mock_reports
    
    response = client.get('/reports/all')
    
    assert response.status_code == 200
    assert response.content_type == 'application/json'

def test_get_report_by_id_success(client, mock_collections):
    """Test getting report by valid ID."""
    report_id = str(ObjectId())
    mock_report = {
        "_id": ObjectId(report_id),
        "userId": "test_user",
        "type": "smoke"
    }
    mock_collections['reports'].find_one.return_value = mock_report
    
    response = client.get(f'/reports/{report_id}')
    
    assert response.status_code == 200
    assert response.content_type == 'application/json'

def test_get_report_by_id_invalid_id(client, mock_collections):
    """Test getting report by invalid ID."""
    response = client.get('/reports/invalid_id')
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert "Invalid report ID" in data["error"]

def test_get_report_by_id_not_found(client, mock_collections):
    """Test getting report that doesn't exist."""
    report_id = str(ObjectId())
    mock_collections['reports'].find_one.return_value = None
    
    response = client.get(f'/reports/{report_id}')
    
    assert response.status_code == 404
    data = json.loads(response.data)
    assert "Report not found" in data["error"]

def test_create_report_success(client, mock_collections, sample_report_data):
    """Test successful report creation."""
    response = client.post('/reports/create',
                          data=json.dumps(sample_report_data),
                          content_type='application/json')
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert "Report created successfully" in data["message"]
    assert "reportId" in data
    mock_collections['reports'].insert_one.assert_called_once()

def test_create_report_no_data(client, mock_collections):
    """Test report creation with no data."""
    response = client.post('/reports/create',
                          data=json.dumps({}),
                          content_type='application/json')
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert "No data provided" in data["error"]

def test_create_report_no_userid(client, mock_collections):
    """Test report creation without userId."""
    response = client.post('/reports/create',
                          data=json.dumps({"description": "test"}),
                          content_type='application/json')
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert "No data provided" in data["error"]

def test_approve_report_success(client, mock_collections):
    """Test successful report approval."""
    # Mock existing moderator
    mock_moderator = {
        "userID": "mod_user_123",
        "moderatorName": "Jane Smith",
        "moderatorBackground": "Fire expert",
        "moderatorContact": {"email": "jane@example.com"}
    }
    mock_collections['moderators'].find_one.return_value = mock_moderator
    
    approve_data = {"userId": "mod_user_123"}
    response = client.post('/reports/approve',
                          data=json.dumps(approve_data),
                          content_type='application/json')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "Moderator approved successfully" in data["message"]

def test_approve_report_no_data(client, mock_collections):
    """Test report approval with no data."""
    response = client.post('/reports/approve',
                          data=json.dumps({}),
                          content_type='application/json')
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert "Invalid request" in data["error"]

def test_approve_report_invalid_userid(client, mock_collections):
    """Test report approval with invalid moderator ID."""
    mock_collections['moderators'].find_one.return_value = None
    
    approve_data = {"userId": "invalid_mod"}
    response = client.post('/reports/approve',
                          data=json.dumps(approve_data),
                          content_type='application/json')
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert "Invalid user ID" in data["error"]

# ========== WILDFIRE TESTS ==========

def test_get_wildfires_empty(client):
    """Test getting wildfires when none exist."""
    response = client.get('/wildfires/get')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "wildfires" in data
    assert data["wildfires"] == []

@patch('backend.fetch_nasa_geojson')
def test_get_nasa_wildfires_success(mock_fetch, client):
    """Test successful NASA wildfire data fetch."""
    mock_geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [-120, 40]},
                "properties": {"bright_ti4": 320.5, "confidence": 80}
            }
        ]
    }
    mock_fetch.return_value = mock_geojson
    
    response = client.get('/wildfires/nasa')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "type" in data
    assert data["type"] == "FeatureCollection"
    mock_fetch.assert_called_once()

@patch('backend.fetch_nasa_geojson')
def test_get_nasa_wildfires_api_error(mock_fetch, client):
    """Test NASA wildfire API error handling."""
    mock_fetch.side_effect = Exception("API Error")
    
    with pytest.raises(Exception):
        client.get('/wildfires/nasa')

# ========== INTEGRATION TESTS ==========

def test_user_moderator_report_workflow(client, mock_collections, sample_user_data, sample_moderator_data, sample_report_data):
    """Test complete workflow: create user, create moderator, create report, approve report."""
    
    # Create user
    user_response = client.post('/users/create',
                               data=json.dumps(sample_user_data),
                               content_type='application/json')
    assert user_response.status_code == 201
    
    # Create moderator
    mod_response = client.post('/moderators/create',
                              data=json.dumps(sample_moderator_data),
                              content_type='application/json')
    assert mod_response.status_code == 201
    
    # Create report
    report_response = client.post('/reports/create',
                                 data=json.dumps(sample_report_data),
                                 content_type='application/json')
    assert report_response.status_code == 201
    
    # Mock moderator for approval
    mock_collections['moderators'].find_one.return_value = sample_moderator_data
    
    # Approve report
    approve_response = client.post('/reports/approve',
                                  data=json.dumps({"userId": sample_moderator_data["userID"]}),
                                  content_type='application/json')
    assert approve_response.status_code == 200

def test_data_validation_edge_cases(client, mock_collections):
    """Test edge cases and data validation."""
    
    # Test with missing required fields
    incomplete_user = {"email": "test@example.com"}  # Missing other required fields
    response = client.post('/users/create',
                          data=json.dumps(incomplete_user),
                          content_type='application/json')
    assert response.status_code == 201  # Should still work with defaults
    
    # Test with invalid JSON
    response = client.post('/users/create',
                          data="invalid json",
                          content_type='application/json')
    assert response.status_code == 400

def test_database_connection_errors(client, mock_collections):
    """Test database connection error scenarios."""
    
    # Simulate database connection failure
    mock_collections['users'].insert_one.side_effect = Exception("Database connection failed")
    
    sample_data = {"email": "test@example.com"}
    
    with pytest.raises(Exception):
        client.post('/users/create',
                   data=json.dumps(sample_data),
                   content_type='application/json')

if __name__ == '__main__':
    pytest.main([__file__])