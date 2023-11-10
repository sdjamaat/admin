import React from "react"
import { Button } from "antd"
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  PDFViewer,
  PDFDownloadLink,
} from "@react-pdf/renderer"
import { SingleImportedThaaliSelection } from "../../../../utils/types"

const styles = StyleSheet.create({
  body: {
    width: "8.5in !important",
    height: "11in !important",
    paddingTop: ".5in",
    marginLeft: ".22in",
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  label: {
    width: "2.6in",
    height: "1in",
    marginRight: ".13in",
    textAlign: "center",
    overflow: "hidden",
    // border: "1px dotted black",
    // borderRadius: "5px",
    display: "flex",
    flexDirection: "row",
    fontSize: "12px",
    padding: "5px",
  },
})

const getColorForCode = (item: SingleImportedThaaliSelection) => {
  if (item.Code) {
    const codeBeggining = item.Code.split("-")[0]
    switch (codeBeggining) {
      case "SR":
        return "#FF0000" // "red"
      case "ES":
        return "#964B00" //"brown"
      case "4S":
        return "#00FF00" // "green"
      case "UC":
        return "#0000FF" //"blue"
      case "PY":
        return "#FFA500" // "orange"
      case "RB":
        return "#8F00FF" // "violet"
      case "CV":
        return "#FF00FF" // "bright pink"
      case "WW":
        return "#006400" // "dark yellow"
      case "MM":
        return "#00FFFF" // "bright turquoise"
      default:
        return "#000000" // "black"
    }
  } else {
    return "#000000"
  }
}

interface PropsAllLabelsDocument {
  data: SingleImportedThaaliSelection[]
  isBlackAndWhite: boolean
}

const AllLabelsDocument = ({
  data,
  isBlackAndWhite,
}: PropsAllLabelsDocument) => {
  return (
    <Document>
      <Page
        // @ts-ignore
        size="Letter"
        style={{
          ...styles.body,
        }}
      >
        {data.map((item, index) => {
          const color = isBlackAndWhite ? "black" : getColorForCode(item)
          return (
            <View key={index} style={styles.label} wrap={false}>
              <div style={{ justifyContent: "space-between" }}>
                <Text style={{ fontSize: "20px" }}>
                  {item.ContainerOrCountText || item.Size.charAt(0)}
                </Text>
                <Text
                  style={{ fontSize: "22px", color: color, fontWeight: "bold" }}
                >
                  {item.Code}
                </Text>
              </div>
              <div
                style={{
                  justifyContent: "space-between",
                  overflow: "hidden",
                  marginLeft: "25px",
                }}
              >
                <Text>{item.Distribution}</Text>
                <Text>{item.Item}</Text>
                <Text>{item.Family.split(" ")[0]}</Text>
              </div>
            </View>
          )
        })}
      </Page>
    </Document>
  )
}

const LabelPDF = ({ data, isBlackAndWhite }) => {
  return (
    <div style={{ marginTop: "15px" }}>
      <div>
        <PDFDownloadLink
          document={
            <AllLabelsDocument data={data} isBlackAndWhite={isBlackAndWhite} />
          }
          fileName="labels.pdf"
        >
          {({ blob, url, loading, error }) =>
            loading ? (
              "Loading document..."
            ) : (
              <Button type="primary">Download PDF</Button>
            )
          }
        </PDFDownloadLink>
      </div>
      <PDFViewer style={{ height: "100vh", width: "100%", marginTop: "10px" }}>
        <AllLabelsDocument data={data} isBlackAndWhite={isBlackAndWhite} />
      </PDFViewer>
    </div>
  )
}

export default LabelPDF
