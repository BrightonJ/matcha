INSERT INTO tags (name) VALUES 
    ('geek'), ('sport'), ('vegan'), ('music'), ('travel'),
    ('art'), ('cinema'), ('cuisine'), ('lecture'), ('nature'),
    ('fitness'), ('yoga'), ('photographie'), ('danse'), ('théâtre'),
    ('jeux vidéo'), ('sciences'), ('histoire'), ('mode'), ('animaux')
ON CONFLICT (name) DO NOTHING;
