import { ApolloServer, gql } from "apollo-server";
import axios from "axios";
import dotenv from "dotenv";
import moment from "moment";
dotenv.config();
const URI = "https://api.rawg.io/api/";

const typeDefs = gql`
  type Game {
    id: Int!
    name: String!
    rating: String
    released: String!
    backgroundImage: String
    description: String
    playtime: Int!
    platforms: [PlatformContainer]!
  }
  type Requirements {
    minimum: String
  }
  type PlatformContainer {
    requirements_en: Requirements
    requirements_ru: Requirements
    platform: Platform!
  }
  type Platform {
    id: Int!
    name: String!
    games_count: Int!
  }
  type Query {
    games(limit: Int): [Game]!
    upcomingGames(limit: Int): [Game]!
    mostPlayedGames: [Game]!
    platforms: [Platform]!
    game(id: Int): Game
  }
`;

const resolvers = {
  Query: {
    games: async (_: any, args: { limit?: number }) => {
      const query = "games";
      const response = await axios.get(
        URI +
          query +
          "?key=" +
          process.env.API_KEY +
          "&page_size=" +
          (args.limit ? args.limit : 40)
      );
      return response.data.results;
    },
    upcomingGames: async (_: any, args: { limit?: number }) => {
      const query = "games";
      const todayDate = moment().format("YYYY-MM-DD");
      const nextYear = parseInt(todayDate.substring(0, 4)) + 1;
      const response = await axios.get(`
      ${URI}${query}?key=${process.env.API_KEY}&page_size=${
        args.limit ? args.limit : 40
      }&dates=${todayDate},${nextYear}-01-01`);
      return response.data.results.sort((a: any, b: any) => {
        return (
          parseInt(a.released.split("-")[1]) -
          parseInt(b.released.split("-")[1])
        );
      });
    },
    mostPlayedGames: async () => {
      const query = "games";
      const response = await axios.get(
        URI + query + "?key=" + process.env.API_KEY
      );
      const filtered = response.data.results.sort(
        (a: any, b: any) => b.playtime - a.playtime
      );
      return filtered.slice(0, 3);
    },
    platforms: async () => {
      const query = "platforms";
      const response = await axios.get(
        URI + query + "?key=" + process.env.API_KEY
      );
      return response.data.results;
    },
    game: async (_: any, args: { id?: number }) => {
      const query = "games/" + args.id;
      const response = await axios.get(
        URI + query + "?key=" + process.env.API_KEY
      );
      return response.data;
    },
  },
  Game: {
    backgroundImage: (root: any) => {
      return root.background_image;
    },
    description: (root: any) => {
      return root.description_raw;
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server
  .listen(4000)
  .then(({ url }) => console.log(`🚀  Server ready at ${url}`));
