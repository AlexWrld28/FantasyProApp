create unique index if not exists team_players_unique_player_idx
on public.team_players (player_id);

insert into public.players (external_id, full_name, team, position, source, metadata)
values
  ('nfl-caleb-williams', 'Caleb Williams', 'CHI', 'QB', 'seed', '{"opponent":"MIN","projected_points":19.4,"trade_value":67,"age":24,"risk":34,"trend":"rising","keeper_grade":88,"image_url":"https://a.espncdn.com/i/headshots/nfl/players/full/4431611.png","note":"High-upside starter with rushing floor."}'::jsonb),
  ('nfl-bijan-robinson', 'Bijan Robinson', 'ATL', 'RB', 'seed', '{"opponent":"NO","projected_points":18.1,"trade_value":93,"age":24,"risk":18,"trend":"rising","keeper_grade":96,"image_url":"https://a.espncdn.com/i/headshots/nfl/players/full/4430807.png","note":"Elite weekly ceiling and long-term anchor."}'::jsonb),
  ('nfl-puka-nacua', 'Puka Nacua', 'LAR', 'WR', 'seed', '{"opponent":"ARI","projected_points":16.2,"trade_value":86,"age":25,"risk":24,"trend":"steady","keeper_grade":91,"image_url":"https://a.espncdn.com/i/headshots/nfl/players/full/4426515.png","note":"Volume receiver with strong keeper profile."}'::jsonb),
  ('nfl-sam-laporta', 'Sam LaPorta', 'DET', 'TE', 'seed', '{"opponent":"GB","projected_points":11.6,"trade_value":72,"age":25,"risk":26,"trend":"rising","keeper_grade":89,"image_url":"https://a.espncdn.com/i/headshots/nfl/players/full/4430027.png","note":"Premium positional edge at TE."}'::jsonb),
  ('nfl-deebo-samuel', 'Deebo Samuel', 'SF', 'WR', 'seed', '{"opponent":"SEA","projected_points":13.8,"trade_value":63,"age":30,"risk":48,"trend":"falling","keeper_grade":58,"image_url":"https://a.espncdn.com/i/headshots/nfl/players/full/3126486.png","note":"Playmaker, but health and age add volatility."}'::jsonb),
  ('nfl-jayden-daniels', 'Jayden Daniels', 'WAS', 'QB', 'seed', '{"opponent":"DAL","projected_points":20.1,"trade_value":82,"age":25,"risk":28,"trend":"rising","keeper_grade":94,"image_url":"https://a.espncdn.com/i/headshots/nfl/players/full/4426348.png","note":"Dual-threat QB with weekly top-five upside."}'::jsonb),
  ('nfl-jahmyr-gibbs', 'Jahmyr Gibbs', 'DET', 'RB', 'seed', '{"opponent":"GB","projected_points":17.6,"trade_value":91,"age":24,"risk":20,"trend":"rising","keeper_grade":95,"image_url":"https://a.espncdn.com/i/headshots/nfl/players/full/4429795.png","note":"Explosive PPR back with premium keeper value."}'::jsonb),
  ('nfl-garrett-wilson', 'Garrett Wilson', 'NYJ', 'WR', 'seed', '{"opponent":"NE","projected_points":15.2,"trade_value":78,"age":26,"risk":30,"trend":"steady","keeper_grade":87,"image_url":"https://a.espncdn.com/i/headshots/nfl/players/full/4569618.png","note":"Target earner with stable floor."}'::jsonb),
  ('nfl-trey-mcbride', 'Trey McBride', 'ARI', 'TE', 'seed', '{"opponent":"LAR","projected_points":12.2,"trade_value":72,"age":26,"risk":26,"trend":"rising","keeper_grade":89,"image_url":"https://a.espncdn.com/i/headshots/nfl/players/full/4361307.png","note":"Premium positional edge at TE."}'::jsonb),
  ('nfl-amon-ra-st-brown', 'Amon-Ra St. Brown', 'DET', 'WR', 'seed', '{"opponent":"GB","projected_points":17.9,"trade_value":95,"age":26,"risk":14,"trend":"steady","keeper_grade":97,"image_url":"https://a.espncdn.com/i/headshots/nfl/players/full/4374302.png","note":"Elite target share and week-proof floor."}'::jsonb),
  ('nfl-jonathan-taylor', 'Jonathan Taylor', 'IND', 'RB', 'seed', '{"opponent":"HOU","projected_points":15.8,"trade_value":74,"age":27,"risk":36,"trend":"steady","keeper_grade":72,"image_url":"https://a.espncdn.com/i/headshots/nfl/players/full/4242335.png","note":"Strong contender piece with workload upside."}'::jsonb),
  ('nfl-brock-bowers', 'Brock Bowers', 'LV', 'TE', 'seed', '{"opponent":"KC","projected_points":13.5,"trade_value":84,"age":23,"risk":20,"trend":"rising","keeper_grade":98,"image_url":"https://a.espncdn.com/i/headshots/nfl/players/full/4432665.png","note":"Rare TE asset with elite dynasty profile."}'::jsonb),
  ('nfl-drake-london', 'Drake London', 'ATL', 'WR', 'seed', '{"opponent":"NO","projected_points":14.6,"trade_value":76,"age":25,"risk":31,"trend":"rising","keeper_grade":86,"image_url":"https://a.espncdn.com/i/headshots/nfl/players/full/4426502.png","note":"Ascending receiver with target dominance."}'::jsonb),
  ('nfl-kyren-williams', 'Kyren Williams', 'LAR', 'RB', 'seed', '{"opponent":"ARI","projected_points":15.9,"trade_value":70,"age":26,"risk":42,"trend":"steady","keeper_grade":68,"image_url":"https://a.espncdn.com/i/headshots/nfl/players/full/4430737.png","note":"Touch volume is excellent, durability risk remains."}'::jsonb),
  ('nfl-marvin-harrison-jr', 'Marvin Harrison Jr.', 'ARI', 'WR', 'seed', '{"opponent":"LAR","projected_points":14.2,"trade_value":88,"age":24,"risk":28,"trend":"rising","keeper_grade":97,"image_url":"https://a.espncdn.com/i/headshots/nfl/players/full/4432708.png","note":"Premium long-term bet."}'::jsonb),
  ('nfl-rome-odunze', 'Rome Odunze', 'CHI', 'WR', 'seed', '{"opponent":"MIN","projected_points":9.3,"trade_value":51,"age":24,"risk":35,"trend":"rising","keeper_grade":79,"image_url":"https://a.espncdn.com/i/headshots/nfl/players/full/4431299.png","note":"Bench upside receiver."}'::jsonb)
on conflict (external_id) do update
set
  full_name = excluded.full_name,
  metadata = public.players.metadata || excluded.metadata,
  position = excluded.position,
  team = excluded.team,
  updated_at = now();
